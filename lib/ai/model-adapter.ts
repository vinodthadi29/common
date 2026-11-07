import { generateText, Output } from "ai"
import { z } from "zod"

const DEFAULT_MODEL = "alibaba/qwen-3-14b"
const DEFAULT_TIMEOUT_MS = 20_000
const MAX_RETRIES = 2

type ModelHealth = {
  status: "configured" | "available" | "unavailable" | "disabled"
  model: string
  checkedAt: string
  detail?: string
}

export class AiUnavailableError extends Error {
  constructor(message = "The AI model is unavailable.") {
    super(message)
    this.name = "AiUnavailableError"
  }
}

export function getAiConfig() {
  const disabled = process.env.COMMON_ONE_AI_DISABLED === "true"
  const model = process.env.COMMON_ONE_AI_MODEL?.trim() || DEFAULT_MODEL
  const timeoutMs = Math.max(5_000, Number(process.env.COMMON_ONE_AI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS))
  return { disabled, model, timeoutMs }
}

export async function getAiHealth(): Promise<ModelHealth> {
  const config = getAiConfig()
  const checkedAt = new Date().toISOString()
  if (config.disabled) return { status: "disabled", model: config.model, checkedAt, detail: "AI is disabled by configuration." }
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/models", { signal: AbortSignal.timeout(5_000), cache: "no-store" })
    if (!response.ok) return { status: "unavailable", model: config.model, checkedAt, detail: `Gateway returned ${response.status}.` }
    const payload = await response.json() as { data?: Array<{ id?: string }> }
    const available = payload.data?.some(entry => entry.id === config.model) ?? false
    return available
      ? { status: "available", model: config.model, checkedAt }
      : { status: "configured", model: config.model, checkedAt, detail: "Configured model was not present in the gateway catalog." }
  } catch (error) {
    return { status: "unavailable", model: config.model, checkedAt, detail: error instanceof Error ? error.message : "Gateway health check failed." }
  }
}

async function runWithRetry<T>(operation: (signal: AbortSignal) => Promise<T>, timeoutMs: number) {
  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await operation(controller.signal)
    } catch (error) {
      lastError = error
      if (attempt < MAX_RETRIES) await new Promise(resolve => setTimeout(resolve, 250 * 2 ** attempt))
    } finally {
      clearTimeout(timer)
    }
  }
  throw new AiUnavailableError(lastError instanceof Error ? lastError.message : undefined)
}

export async function checkAiRateLimit(supabase: { from: (table: string) => any }, userId: string) {
  const since = new Date(Date.now() - 60_000).toISOString()
  const { count } = await supabase.from("audit_events").select("id", { count: "exact", head: true }).eq("user_id", userId).like("event_type", "ai.%").gte("created_at", since)
  return (count ?? 0) < 10
}

export async function generateStructured<T extends z.ZodType>(options: { schema: T; system: string; prompt: string }) {
  const config = getAiConfig()
  if (config.disabled) throw new AiUnavailableError("AI is disabled by configuration.")
  return runWithRetry(async signal => {
    const result = await generateText({ model: config.model, output: Output.object({ schema: options.schema }), system: options.system, prompt: options.prompt, maxRetries: 0, abortSignal: signal })
    if (!result.output) throw new AiUnavailableError("The model returned no structured output.")
    return { output: result.output as z.output<T>, usage: result.usage, model: config.model }
  }, config.timeoutMs)
}

export async function generateAnswer(options: { system: string; messages: Array<{ role: "user" | "assistant"; content: string }> }) {
  const config = getAiConfig()
  if (config.disabled) throw new AiUnavailableError("AI is disabled by configuration.")
  return runWithRetry(async signal => {
    const result = await generateText({ model: config.model, system: options.system, messages: options.messages, maxRetries: 0, abortSignal: signal })
    return { text: result.text, usage: result.usage, model: config.model }
  }, config.timeoutMs)
}

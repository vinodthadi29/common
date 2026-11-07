import { generateText, Output } from "ai"
import { z } from "zod"

const DEFAULT_MODEL = "alibaba/qwen-3-14b"
const DEFAULT_TIMEOUT_MS = 20_000
const MAX_RETRIES = 2

export type AiReadiness = {
  configured: boolean
  gateway: "reachable" | "unreachable" | "disabled"
  modelInCatalog: boolean | null
  generation: "not_tested" | "billing_required" | "authentication_error" | "passed" | "failed"
  schema: "not_tested" | "validated" | "failed"
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

export class AiBillingRequiredError extends AiUnavailableError {
  constructor() {
    super("AI Gateway billing setup is required for generation.")
    this.name = "AiBillingRequiredError"
  }
}

export class AiAuthenticationError extends AiUnavailableError {
  constructor() {
    super("AI Gateway authentication is not available.")
    this.name = "AiAuthenticationError"
  }
}

export class AiMalformedResponseError extends AiUnavailableError {
  constructor() {
    super("The AI provider returned an invalid response.")
    this.name = "AiMalformedResponseError"
  }
}

export function classifyAiFailure(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes("credit card") || normalized.includes("billing") || normalized.includes("add-credit-card")) return "billing_required" as const
  if (normalized.includes("unauthorized") || normalized.includes("invalid api key") || normalized.includes("authentication")) return "authentication_error" as const
  if (normalized.includes("timeout") || normalized.includes("timed out") || normalized.includes("temporarily unavailable") || normalized.includes("429") || normalized.includes("503")) return "transient" as const
  if (normalized.includes("invalid json") || normalized.includes("malformed") || normalized.includes("schema") || normalized.includes("structured output") || normalized.includes("missing required")) return "malformed_response" as const
  return "unknown" as const
}

function classifyProviderError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const failure = classifyAiFailure(message)
  if (failure === "billing_required") return new AiBillingRequiredError()
  if (failure === "authentication_error") return new AiAuthenticationError()
  if (failure === "malformed_response") return new AiMalformedResponseError()
  return null
}

export function getAiConfig() {
  const disabled = process.env.COMMON_ONE_AI_DISABLED === "true"
  const model = process.env.COMMON_ONE_AI_MODEL?.trim() || DEFAULT_MODEL
  const timeoutMs = Math.max(5_000, Number(process.env.COMMON_ONE_AI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS))
  return { disabled, model, timeoutMs }
}

export async function getAiHealth(): Promise<AiReadiness> {
  const config = getAiConfig()
  const checkedAt = new Date().toISOString()
  const base = { configured: !config.disabled && Boolean(config.model), model: config.model, checkedAt, modelInCatalog: null as boolean | null, generation: "not_tested" as const, schema: "not_tested" as const }
  if (config.disabled) return { ...base, configured: false, gateway: "disabled", detail: "AI is disabled by configuration." }
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/models", { signal: AbortSignal.timeout(5_000), cache: "no-store" })
    if (!response.ok) return { ...base, gateway: "unreachable", detail: `Gateway returned ${response.status}.` }
    const payload = await response.json() as { data?: Array<{ id?: string }> }
    const modelInCatalog = payload.data?.some(entry => entry.id === config.model) ?? false
    return { ...base, gateway: "reachable", modelInCatalog, detail: modelInCatalog ? "Model is present in the gateway catalog; generation entitlement was not probed." : "Configured model was not present in the gateway catalog." }
  } catch (error) {
    return { ...base, gateway: "unreachable", detail: error instanceof Error ? error.message : "Gateway health check failed." }
  }
}

export async function runWithRetry<T>(operation: (signal: AbortSignal) => Promise<T>, timeoutMs: number) {
  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await operation(controller.signal)
    } catch (error) {
      const classified = classifyProviderError(error)
      if (classified) throw classified
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

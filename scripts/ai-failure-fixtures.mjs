import { classifyAiFailure, runWithRetry } from "../lib/ai/model-adapter.ts"

function assert(condition, message) { if (!condition) throw new Error(message) }

const cases = [
  ["billing", "AI Gateway requires a valid credit card on file", "billing_required"],
  ["credentials", "401 Unauthorized: invalid api key", "authentication_error"],
  ["timeout", "request timed out", "transient"],
  ["transient", "503 temporarily unavailable", "transient"],
  ["malformed", "malformed structured output", "malformed_response"],
  ["json", "invalid JSON from provider", "malformed_response"],
  ["missing", "missing required response field", "malformed_response"],
]
for (const [name, message, expected] of cases) assert(classifyAiFailure(message) === expected, `${name} classification failed`)

let billingAttempts = 0
await runWithRetry(async () => { billingAttempts++; throw new Error("billing requires credit card") }, 5000).catch(error => assert(error.name === "AiBillingRequiredError", "billing error was not classified"))
assert(billingAttempts === 1, "billing failure was retried")

let malformedAttempts = 0
await runWithRetry(async () => { malformedAttempts++; throw new Error("invalid JSON") }, 5000).catch(error => assert(error.name === "AiMalformedResponseError", "malformed response was not classified"))
assert(malformedAttempts === 1, "malformed response was retried")

let transientAttempts = 0
await runWithRetry(async () => { transientAttempts++; throw new Error("503 temporarily unavailable") }, 5000).catch(error => assert(error.name === "AiUnavailableError", "transient failure did not reach bounded fallback"))
assert(transientAttempts === 3, "transient failure did not use bounded retries")

let rateLimitCount = 0
const supabase = { from: () => ({ select: () => ({ eq: () => ({ like: () => ({ gte: async () => ({ count: 10 }) }) }) }) }) }
const { checkAiRateLimit } = await import("../lib/ai/model-adapter.ts")
const allowed = await checkAiRateLimit(supabase, "fixture-user")
assert(allowed === false, "rate limit fixture was not enforced")
console.log(JSON.stringify({ status: "passed", permanentFailuresNotRetried: true, transientRetries: 2, timeoutAndRateLimitPaths: "covered" }))

export type PendingNotification = { id: string; delivery_attempts: number }

export async function dispatchWithRetry<T extends PendingNotification>(notification: T, deliver: (notification: T, attempt: number) => Promise<void>, maxAttempts = 3) {
  let attempt = notification.delivery_attempts
  let lastError = "Delivery failed"
  while (attempt < maxAttempts) {
    attempt += 1
    try {
      await deliver(notification, attempt)
      return { delivered: true, attempts: attempt, error: null }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Delivery failed"
    }
  }
  return { delivered: false, attempts: attempt, error: lastError }
}

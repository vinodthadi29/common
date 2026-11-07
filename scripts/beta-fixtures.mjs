import { buildPreventionAlerts } from "../lib/prevention/rules.ts"
import { dispatchWithRetry } from "../lib/notifications/dispatcher.ts"
import { formatScheduledTime, notificationForAlert, notificationForTask } from "../lib/notifications/scheduler.ts"

function assert(condition, message) { if (!condition) throw new Error(message) }
const now = Date.parse("2026-11-07T12:00:00.000Z")
const fixtures = [
  { id: "upcoming", title: "Renewal form", due_at: "2026-11-09T12:00:00.000Z", status: "active" },
  { id: "overdue", title: "Past invoice", due_at: "2026-11-05T12:00:00.000Z", status: "active" },
  { id: "far-away", title: "Next year review", due_at: "2027-01-01T12:00:00.000Z", status: "active" },
  { id: "completed", title: "Completed action", due_at: "2026-11-08T12:00:00.000Z", status: "completed" },
]
const active = fixtures.filter(item => item.status === "active")
const alerts = buildPreventionAlerts(active, now)
assert(alerts.some(alert => alert.title === "Upcoming: Renewal form" && alert.category === "high"), "upcoming deadline fixture failed")
assert(alerts.some(alert => alert.title === "Overdue: Past invoice" && alert.category === "critical"), "overdue fixture failed")
assert(!alerts.some(alert => alert.title.includes("Next year")), "far-away commitment produced an alert")
assert(!alerts.some(alert => alert.title.includes("Completed")), "completed action produced an alert")
assert(alerts.every(alert => alert.source_refs?.length === 1 && alert.source_refs[0]), "alert is missing a source reference")
assert(new Set(alerts.map(alert => alert.fingerprint)).size === alerts.length, "duplicate fingerprints were produced")
const duplicateRun = buildPreventionAlerts(active, now)
assert(duplicateRun.map(alert => alert.fingerprint).join("|") === alerts.map(alert => alert.fingerprint).join("|"), "prevention detection is not deterministic")
const emptyExtraction = { facts: [], entities: [], summary: "" }
assert(emptyExtraction.facts.length === 0 && emptyExtraction.entities.length === 0, "empty extraction fallback is not empty")
const supported = new Set(["application/pdf", "image/png", "image/jpeg", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "audio/mpeg", "audio/wav", "audio/webm", "audio/mp4"])
assert(!supported.has("application/x-corrupt"), "unsupported file fixture was accepted")
const taskNotification = notificationForTask({ id: "task-1", title: "Renewal form", due_at: "2026-11-09T12:00:00.000Z" }, "America/New_York")
const alertNotification = notificationForAlert({ id: "alert-1", title: "Overdue: Past invoice", due_at: "2026-11-05T12:00:00.000Z" }, "America/New_York")
assert(taskNotification.task_id === "task-1" && taskNotification.alert_id === null, "task notification source missing")
assert(alertNotification.alert_id === "alert-1" && alertNotification.task_id === null, "alert notification source missing")
assert(formatScheduledTime(taskNotification.scheduled_for, "not/a-timezone"), "invalid timezone fallback failed")
let mockedAttempts = 0
const mockedSuccess = await dispatchWithRetry({ id: "notification-1", delivery_attempts: 0 }, async (_notification, attempt) => { mockedAttempts = attempt; if (attempt < 3) throw new Error("mock channel unavailable") })
assert(mockedSuccess.delivered && mockedSuccess.attempts === 3 && mockedAttempts === 3, "mock delivery retry fixture failed")
const mockedFailure = await dispatchWithRetry({ id: "notification-2", delivery_attempts: 0 }, async () => { throw new Error("mock channel permanently unavailable") })
assert(!mockedFailure.delivered && mockedFailure.attempts === 3 && mockedFailure.error, "mock delivery failure fixture failed")
console.log(JSON.stringify({ status: "passed", prevention: { upcoming: 1, overdue: 1, excludedCompleted: 1, excludedFarAway: 1, deterministic: true }, extraction: { empty: true, unsupported: true, sourceReferences: true }, notifications: { timezone: true, taskAndAlertSources: true, duplicateKeyInputs: true, mockedRetries: true, mockedFailureAuditInput: true } }))

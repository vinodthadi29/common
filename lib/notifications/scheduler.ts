export function formatScheduledTime(date: string, timezone: string) {
  try {
    return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: timezone }).format(new Date(date))
  } catch {
    return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(date))
  }
}

export function notificationForTask(task: { id: string; title: string; due_at: string }, timezone: string) {
  return { task_id: task.id, alert_id: null, title: `Action due: ${task.title}`, body: `Your action is due ${formatScheduledTime(task.due_at, timezone)}.`, scheduled_for: task.due_at }
}

export function notificationForAlert(alert: { id: string; title: string; due_at?: string | null }, timezone: string) {
  const scheduledFor = alert.due_at ?? new Date().toISOString()
  return { task_id: null, alert_id: alert.id, title: alert.title, body: `Review this prevention alert. The related date is ${formatScheduledTime(scheduledFor, timezone)}.`, scheduled_for: scheduledFor }
}

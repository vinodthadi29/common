export type PreventionCommitment = { id: string; title: string; description?: string | null; due_at: string; status: string }

export function buildPreventionAlerts(commitments: PreventionCommitment[], now = Date.now()) {
  const alerts = []
  for (const commitment of commitments) {
    const due = new Date(commitment.due_at).getTime()
    if (!Number.isFinite(due)) continue
    const days = Math.ceil((due - now) / 86400000)
    const category = days < 0 ? "critical" : days <= 2 ? "high" : days <= 7 ? "medium" : null
    if (!category) continue
    const title = days < 0 ? `Overdue: ${commitment.title}` : `Upcoming: ${commitment.title}`
    const fingerprint = `commitment:${commitment.id}:${category}`
    alerts.push({ category, severity: category, title, problem_description: days < 0 ? `This commitment passed its due date ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago.` : `This commitment is due in ${days} day${days === 1 ? "" : "s"}.`, why_it_matters: "Small, explicit follow-through protects trust and lowers mental load.", evidence: [{ label: "Commitment", value: commitment.title }, { label: "Due", value: new Date(commitment.due_at).toISOString() }], source_refs: [commitment.id], due_at: commitment.due_at, confidence: 0.98, recommended_action: days < 0 ? "Choose the next smallest step and schedule it today." : "Block a 20-minute window and confirm the next step.", fingerprint })
  }
  return alerts
}

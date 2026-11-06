import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data, error } = await supabase.from("prevention_alerts").select("id,category,title,problem_description,why_it_matters,evidence,due_at,severity,confidence,recommended_action,review_status,snoozed_until,created_at").eq("user_id", user.id).in("review_status", ["open","confirmed","snoozed"]).order("due_at", { ascending: true, nullsFirst: false })
  if (error) return NextResponse.json({ error: "Unable to load prevention alerts." }, { status: 500 })
  return NextResponse.json({ alerts: data ?? [] })
}

export async function POST() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: commitments } = await supabase.from("commitments").select("id,title,description,due_at,status").eq("user_id", user.id).eq("status", "active").not("due_at", "is", null)
  const now = Date.now(); const alerts = []
  for (const commitment of commitments ?? []) {
    const due = new Date(commitment.due_at).getTime(); const days = Math.ceil((due - now) / 86400000)
    const category = days < 0 ? "critical" : days <= 2 ? "high" : days <= 7 ? "medium" : null
    if (!category) continue
    const title = days < 0 ? `Overdue: ${commitment.title}` : `Upcoming: ${commitment.title}`
    const fingerprint = `commitment:${commitment.id}:${category}`
    alerts.push({ user_id: user.id, category, severity: category, title, problem_description: days < 0 ? `This commitment passed its due date ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago.` : `This commitment is due in ${days} day${days === 1 ? "" : "s"}.`, why_it_matters: "Small, explicit follow-through protects trust and lowers mental load.", evidence: [{ label: "Commitment", value: commitment.title }, { label: "Due", value: new Date(commitment.due_at).toISOString() }], source_refs: [commitment.id], due_at: commitment.due_at, confidence: 0.98, recommended_action: days < 0 ? "Choose the next smallest step and schedule it today." : "Block a 20-minute window and confirm the next step.", fingerprint })
  }
  if (alerts.length) await supabase.from("prevention_alerts").upsert(alerts, { onConflict: "user_id,fingerprint" })
  const { data } = await supabase.from("prevention_alerts").select("id,category,title,problem_description,why_it_matters,evidence,due_at,severity,confidence,recommended_action,review_status,snoozed_until,created_at").eq("user_id", user.id).in("review_status", ["open","confirmed","snoozed"]).order("due_at", { ascending: true, nullsFirst: false })
  return NextResponse.json({ alerts: data ?? [], generated: alerts.length })
}

export async function PATCH(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json(); const allowed = ["open","confirmed","dismissed","resolved","snoozed"]
  if (!allowed.includes(body.review_status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  const { error } = await supabase.from("prevention_alerts").update({ review_status: body.review_status, snoozed_until: body.snoozed_until ?? null, updated_at: new Date().toISOString() }).eq("id", body.id).eq("user_id", user.id)
  if (error) return NextResponse.json({ error: "Unable to update alert." }, { status: 500 }); return NextResponse.json({ ok: true })
}

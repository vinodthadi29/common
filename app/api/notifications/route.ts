import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { notificationForAlert, notificationForTask } from "@/lib/notifications/scheduler"
export async function GET() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const { data, error } = await supabase.from("in_app_notifications").select("id,title,body,scheduled_for,read_at,task_id,alert_id").eq("user_id", user.id).is("read_at", null).order("scheduled_for", { ascending: true }).limit(20); if (error) return NextResponse.json({ error: "Unable to load notifications." }, { status: 500 }); return NextResponse.json({ notifications: data ?? [] }) }
export async function PATCH(request: Request) { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const body = await request.json(); const { error } = await supabase.from("in_app_notifications").update({ read_at: new Date().toISOString() }).eq("id", body.id).eq("user_id", user.id); if (error) return NextResponse.json({ error: "Unable to mark notification read." }, { status: 500 }); await supabase.from("audit_events").insert({ user_id: user.id, actor_type: "user", event_type: "notification.read", entity_type: "in_app_notification", entity_id: body.id }); return NextResponse.json({ ok: true }) }

export async function POST() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: preferences } = await supabase.from("notification_preferences").select("email_enabled,digest_frequency,timezone").eq("user_id", user.id).maybeSingle()
  if (preferences?.digest_frequency === "never" || preferences?.email_enabled === false) return NextResponse.json({ scheduled: 0, skipped: "disabled" })
  const timezone = preferences?.timezone || "UTC"
  const [{ data: tasks }, { data: alerts }] = await Promise.all([
    supabase.from("action_tasks").select("id,title,due_at").eq("user_id", user.id).eq("status", "open").not("due_at", "is", null).limit(50),
    supabase.from("prevention_alerts").select("id,title,due_at").eq("user_id", user.id).in("review_status", ["open", "confirmed"]).limit(50),
  ])
  const candidates = [...(tasks ?? []).map(task => notificationForTask(task as { id: string; title: string; due_at: string }, timezone)), ...(alerts ?? []).map(alert => notificationForAlert(alert, timezone))]
  let scheduled = 0
  for (const candidate of candidates) {
    const query = supabase.from("in_app_notifications").select("id").eq("user_id", user.id).eq("scheduled_for", candidate.scheduled_for)
    const existing = candidate.task_id ? query.eq("task_id", candidate.task_id) : query.eq("alert_id", candidate.alert_id)
    const { data } = await existing.maybeSingle()
    if (data) continue
    const { error } = await supabase.from("in_app_notifications").insert({ user_id: user.id, ...candidate })
    if (!error) scheduled++
  }
  await supabase.from("audit_events").insert({ user_id: user.id, actor_type: "system", event_type: "notification.schedule", payload: { scheduled, timezone } })
  return NextResponse.json({ scheduled, timezone })
}

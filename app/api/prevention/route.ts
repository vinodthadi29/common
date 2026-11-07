import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildPreventionAlerts } from "@/lib/prevention/rules"

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
  const alerts = buildPreventionAlerts(commitments ?? []).map(alert => ({ user_id: user.id, ...alert }))
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

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { dispatchWithRetry } from "@/lib/notifications/dispatcher"

export const runtime = "nodejs"

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error("Supabase service credentials are not configured")
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(request: Request) {
  const expected = process.env.NOTIFICATION_CRON_SECRET
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = getAdmin()
  const now = new Date().toISOString()
  const { data: pending, error } = await supabase.from("in_app_notifications").select("id,user_id,delivery_attempts").is("delivered_at", null).lte("scheduled_for", now).lt("delivery_attempts", 3).order("scheduled_for", { ascending: true }).limit(100)
  if (error) return NextResponse.json({ error: "Unable to load notification queue." }, { status: 500 })
  let delivered = 0; let failed = 0
  for (const notification of pending ?? []) {
    const result = await dispatchWithRetry(notification, async (queued, attempt) => {
      const { error: deliveryError } = await supabase.from("in_app_notifications").update({ delivered_at: now, delivery_attempts: attempt, last_error: null }).eq("id", queued.id).is("delivered_at", null)
      if (deliveryError) {
        await supabase.from("in_app_notifications").update({ delivery_attempts: attempt, last_error: deliveryError.message }).eq("id", queued.id)
        throw deliveryError
      }
    })
    if (result.delivered) {
      await supabase.from("audit_events").insert({ user_id: notification.user_id, actor_type: "system", event_type: "notification.delivered", entity_type: "in_app_notification", entity_id: notification.id, payload: { attempt: result.attempts } })
      delivered++
    } else {
      await supabase.from("in_app_notifications").update({ delivery_attempts: result.attempts, last_error: result.error }).eq("id", notification.id)
      await supabase.from("audit_events").insert({ user_id: notification.user_id, actor_type: "system", event_type: "notification.failed", entity_type: "in_app_notification", entity_id: notification.id, payload: { attempt: result.attempts, error: result.error } })
      failed++
    }
  }
  return NextResponse.json({ delivered, failed, attempted: pending?.length ?? 0 })
}

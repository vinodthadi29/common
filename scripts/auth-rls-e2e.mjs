import { createClient } from "@supabase/supabase-js"
import { randomUUID } from "node:crypto"

if (process.env.RUN_AUTH_E2E !== "1") {
  console.log("SKIP authenticated Supabase E2E: set RUN_AUTH_E2E=1 in a safe test project")
  process.exit(0)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !anonKey || !serviceKey) throw new Error("Supabase URL, anon key, and service-role key are required")

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
const suffix = randomUUID().slice(0, 8)
const password = `E2E-${randomUUID()}-Strong!`
const users = [`common-e2e-a-${suffix}@test.local`, `common-e2e-b-${suffix}@test.local`]
const clients = users.map(() => createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } }))
let userIds = []
let captureIds = []
let conversationIds = []

function assert(condition, message) { if (!condition) throw new Error(message) }
async function must(promise, label) { const result = await promise; if (result.error) throw new Error(`${label}: ${result.error.message}`); return result.data }

try {
  for (const email of users) {
    const created = await must(admin.auth.admin.createUser({ email, password, email_confirm: true }), "create test user")
    userIds.push(created.user.id)
  }
  for (let index = 0; index < clients.length; index++) await must(clients[index].auth.signInWithPassword({ email: users[index], password }), `sign in user ${index + 1}`)

  const captureA = await must(clients[0].from("captured_items").insert({ user_id: userIds[0], capture_type: "document", title: "E2E private document", content: "User A private fixture", processing_status: "queued" }).select("id").single(), "insert user A capture")
  captureIds.push(captureA.id)
  const captureB = await must(clients[1].from("captured_items").insert({ user_id: userIds[1], capture_type: "document", title: "E2E user B document", content: "User B private fixture", processing_status: "queued" }).select("id").single(), "insert user B capture")
  captureIds.push(captureB.id)
  const conversationA = await must(clients[0].from("assistant_conversations").insert({ user_id: userIds[0], title: "E2E A" }).select("id").single(), "insert user A conversation")
  conversationIds.push(conversationA.id)
  const conversationB = await must(clients[1].from("assistant_conversations").insert({ user_id: userIds[1], title: "E2E B" }).select("id").single(), "insert user B conversation")
  conversationIds.push(conversationB.id)

  const ownCapture = await must(clients[0].from("captured_items").select("id,title").eq("id", captureA.id), "read own capture")
  const crossCapture = await must(clients[0].from("captured_items").select("id").eq("id", captureB.id), "cross-read capture")
  assert(ownCapture.length === 1 && crossCapture.length === 0, "capture RLS isolation failed")
  const crossConversation = await must(clients[0].from("assistant_conversations").select("id").eq("id", conversationB.id), "cross-read conversation")
  assert(crossConversation.length === 0, "conversation RLS isolation failed")
  const crossUpdate = await clients[0].from("captured_items").update({ title: "MUST NOT UPDATE" }).eq("id", captureB.id).select("id")
  assert(!crossUpdate.error && (crossUpdate.data ?? []).length === 0, "cross-user update was not blocked")
  const crossDelete = await clients[0].from("captured_items").delete().eq("id", captureB.id).select("id")
  assert(!crossDelete.error && (crossDelete.data ?? []).length === 0, "cross-user delete was not blocked")
  const anonymous = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const anonymousRead = await anonymous.from("captured_items").select("id").eq("id", captureA.id)
  assert(!anonymousRead.error && (anonymousRead.data ?? []).length === 0, "anonymous read was not isolated")
  const expired = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  await expired.auth.setSession({ access_token: "invalid", refresh_token: "invalid" })
  const expiredRead = await expired.from("captured_items").select("id").eq("id", captureA.id)
  assert((expiredRead.data ?? []).length === 0, "invalid session returned private data")
  console.log(JSON.stringify({ status: "passed", users: 2, ownReads: 2, crossReads: 0, crossUpdates: 0, crossDeletes: 0, anonymousReads: 0, invalidSessionReads: 0 }))
} finally {
  for (const id of captureIds) await admin.from("captured_items").delete().eq("id", id)
  for (const id of conversationIds) await admin.from("assistant_conversations").delete().eq("id", id)
  for (const id of userIds) await admin.auth.admin.deleteUser(id)
}

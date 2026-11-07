import { createClient } from "@supabase/supabase-js"
import { randomUUID } from "node:crypto"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
if (!url || !serviceKey) throw new Error("Supabase test credentials are required")
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
const suffix = randomUUID().slice(0, 8)
const users = [
  { email: `common-graph-a-${suffix}@example.test`, password: `Graph-A-${randomUUID()}-Strong!` },
  { email: `common-graph-b-${suffix}@example.test`, password: `Graph-B-${randomUUID()}-Strong!` },
]
const ids = []

try {
  for (const user of users) {
    const result = await admin.auth.admin.createUser({ email: user.email, password: user.password, email_confirm: true })
    if (result.error) throw result.error
    ids.push(result.data.user.id)
  }
  const owner = createClient(url, process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY)
  const other = createClient(url, process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY)
  if ((await owner.auth.signInWithPassword(users[0])).error) throw new Error("owner sign-in failed")
  if ((await other.auth.signInWithPassword(users[1])).error) throw new Error("second-user sign-in failed")

  const { data: capture, error: captureError } = await owner.from("captured_items").insert({ user_id: ids[0], capture_type: "document", title: "Synthetic renewal brief", content: "Jordan owns the renewal brief for Project North. The review is due November 30, 2026." }).select("id").single()
  if (captureError || !capture) throw captureError || new Error("capture fixture failed")
  const { data: entities, error: entityError } = await owner.from("people_entities").insert([{ user_id: ids[0], display_name: "Jordan", entity_type: "person" }, { user_id: ids[0], display_name: "Project North", entity_type: "project" }]).select("id,display_name")
  if (entityError || !entities || entities.length !== 2) throw entityError || new Error("entity fixture failed")
  const jordan = entities.find(entity => entity.display_name === "Jordan")
  const project = entities.find(entity => entity.display_name === "Project North")
  const { data: facts, error: factError } = await owner.from("extracted_facts").insert([{ user_id: ids[0], source_item_id: capture.id, subject_entity_id: jordan.id, fact_type: "ownership", fact_text: "Jordan owns the renewal brief for Project North.", confidence: 0.99 }, { user_id: ids[0], source_item_id: capture.id, subject_entity_id: project.id, fact_type: "deadline", fact_text: "The review is due November 30, 2026.", confidence: 0.98 }]).select("id,source_item_id,subject_entity_id")
  if (factError || !facts || facts.length !== 2 || facts.some(fact => fact.source_item_id !== capture.id)) throw factError || new Error("fact source-reference fixture failed")
  const { data: relationship, error: relationshipError } = await owner.from("context_relationships").insert({ user_id: ids[0], from_entity_id: jordan.id, to_entity_id: project.id, relationship_type: "owns", strength: 0.95, evidence_count: facts.length }).select("id,from_entity_id,to_entity_id").single()
  if (relationshipError || !relationship) throw relationshipError || new Error("relationship fixture failed")

  const { data: ownerCapture } = await owner.from("captured_items").select("id").eq("id", capture.id)
  const { data: otherCapture } = await other.from("captured_items").select("id").eq("id", capture.id)
  const { data: ownerFacts } = await owner.from("extracted_facts").select("id,source_item_id").eq("source_item_id", capture.id)
  const { data: otherFacts } = await other.from("extracted_facts").select("id").eq("source_item_id", capture.id)
  const { data: otherRelationship } = await other.from("context_relationships").select("id").eq("id", relationship.id)
  if (ownerCapture?.length !== 1 || ownerFacts?.length !== 2 || otherCapture?.length !== 0 || otherFacts?.length !== 0 || otherRelationship?.length !== 0) throw new Error("ownership isolation fixture failed")
  console.log(JSON.stringify({ status: "passed", document: true, facts: facts.length, graphRelationship: true, sourceReferences: true, ownerIsolation: true }))
} finally {
  for (const id of ids) await admin.auth.admin.deleteUser(id)
}

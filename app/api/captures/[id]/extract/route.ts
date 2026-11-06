import { NextResponse } from "next/server"
import { generateText, Output } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const extractionSchema = z.object({ facts: z.array(z.object({ fact_type: z.string(), fact_text: z.string(), confidence: z.number().min(0).max(1) })).max(12), entities: z.array(z.object({ display_name: z.string(), entity_type: z.enum(["person", "place", "organization", "project", "concept"]) })).max(12), summary: z.string().max(500) })

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sign in to extract context." }, { status: 401 })
  const { data: capture, error: captureError } = await supabase.from("captured_items").select("id, content, title, mime_type, processing_status").eq("id", id).eq("user_id", user.id).single()
  if (captureError || !capture) return NextResponse.json({ error: "Capture not found." }, { status: 404 })
  if (!capture.content?.trim()) { await supabase.from("captured_items").update({ processing_status: "needs_review" }).eq("id", id).eq("user_id", user.id); return NextResponse.json({ status: "needs_review", message: "This file needs transcription or text extraction before AI review." }) }

  await supabase.from("captured_items").update({ processing_status: "processing" }).eq("id", id).eq("user_id", user.id)
  try {
    const { output } = await generateText({ model: "alibaba/qwen-3-14b", output: Output.object({ schema: extractionSchema }), system: "You extract private life context. Be conservative: only return facts directly supported by the source. Never invent details. Identify people, places, organizations, projects, and concepts. Keep facts concise.", prompt: `Capture title: ${capture.title ?? "Untitled"}\n\nSource text:\n${capture.content.slice(0, 16000)}` })
    if (!output) throw new Error("No structured output")
    const { data: entities } = await supabase.from("people_entities").insert(output.entities.map((entity) => ({ user_id: user.id, display_name: entity.display_name, entity_type: entity.entity_type }))).select("id, display_name")
    const entityByName = new Map((entities ?? []).map((entity) => [entity.display_name.toLowerCase(), entity.id]))
    if (output.facts.length) await supabase.from("extracted_facts").insert(output.facts.map((fact) => ({ user_id: user.id, source_item_id: id, fact_type: fact.fact_type, fact_text: fact.fact_text, confidence: fact.confidence, verification_status: "unverified" })))
    await supabase.from("captured_items").update({ processing_status: "completed", processed_at: new Date().toISOString(), metadata: { extraction_summary: output.summary, entity_count: output.entities.length, fact_count: output.facts.length } }).eq("id", id).eq("user_id", user.id)
    return NextResponse.json({ ...output, entityIds: [...entityByName.values()] })
  } catch { await supabase.from("captured_items").update({ processing_status: "failed" }).eq("id", id).eq("user_id", user.id); return NextResponse.json({ error: "AI extraction is temporarily unavailable." }, { status: 503 }) }
}

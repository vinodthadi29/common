import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const allowedTypes = new Set(["application/pdf", "image/png", "image/jpeg", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "audio/mpeg", "audio/wav", "audio/webm", "audio/mp4"])
const maxBytes = 25 * 1024 * 1024

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sign in to capture context." }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file")
  const note = String(formData.get("note") ?? "").trim()
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 })
  if (file.size > maxBytes) return NextResponse.json({ error: "Files must be 25 MB or smaller." }, { status: 400 })
  if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "That file type is not supported." }, { status: 400 })

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-")
  const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`
  const bytes = new Uint8Array(await file.arrayBuffer())
  const { error: uploadError } = await supabase.storage.from("private-captures").upload(storagePath, bytes, { contentType: file.type, upsert: false })
  if (uploadError) return NextResponse.json({ error: "We couldn't securely store that file." }, { status: 500 })

  const content = file.type === "text/plain" ? new TextDecoder().decode(bytes).slice(0, 20000) : note
  const { data, error } = await supabase.from("captured_items").insert({ user_id: user.id, capture_type: file.type.startsWith("audio/") ? "voice_memo" : file.type.startsWith("image/") ? "photo" : "document", title: file.name, content, storage_path: storagePath, file_name: file.name, mime_type: file.type, byte_size: file.size, processing_status: "uploaded", metadata: { note } }).select("id, title, mime_type, byte_size, processing_status, created_at").single()
  if (error) { await supabase.storage.from("private-captures").remove([storagePath]); return NextResponse.json({ error: "We couldn't create the capture record." }, { status: 500 }) }
  return NextResponse.json({ capture: data })
}

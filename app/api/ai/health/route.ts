import { NextResponse } from "next/server"
import { getAiHealth } from "@/lib/ai/model-adapter"

export const runtime = "nodejs"

export async function GET() {
  const health = await getAiHealth()
  return NextResponse.json(health, { status: health.gateway === "unreachable" ? 503 : 200 })
}

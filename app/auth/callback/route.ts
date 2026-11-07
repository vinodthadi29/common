import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSafeNextPath } from "@/lib/auth/redirect"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const requestedNext = url.searchParams.get("next")
  const next = getSafeNextPath(requestedNext, url.searchParams.get("type") === "recovery" ? "/reset-password" : "/dashboard")
  if (!code) return NextResponse.redirect(new URL("/login?error=missing_auth_code", url.origin))
  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(new URL("/login?error=invalid_auth_link", url.origin))
  return NextResponse.redirect(new URL(next, url.origin))
}

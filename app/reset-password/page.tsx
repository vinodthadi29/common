"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [updated, setUpdated] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (password !== confirmation) { setError("Passwords do not match."); return }
    setLoading(true)
    const { error: updateError } = await createClient().auth.updateUser({ password })
    if (updateError) setError("That reset link is invalid or expired. Request a new one and try again.")
    else { setUpdated(true); setTimeout(() => router.push("/dashboard"), 900) }
    setLoading(false)
  }

  return <main className="auth-page"><section className="auth-panel"><Link href="/" className="auth-brand"><span>COMMON</span><small>ONE</small></Link><div className="auth-copy"><p className="eyebrow">Reset access</p><h1>{updated ? "You&apos;re back in." : "Choose a new password."}</h1><p>{updated ? "Your password was updated securely. Taking you to your private workspace." : "Use a strong password you do not reuse elsewhere."}</p></div>{!updated && <form onSubmit={submit} className="auth-form"><label>New password<input type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" /></label><label>Confirm password<input type="password" minLength={6} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? "Updating…" : "Update password"}</button></form>}<div className="auth-links"><Link href="/login">Back to sign in</Link></div></section><aside className="auth-aside"><p className="eyebrow">A small reset</p><blockquote>“You can always begin again with one clear next step.”</blockquote><span>PRIVATE BY DEFAULT · BUILT FOR REFLECTION</span></aside></main>
}

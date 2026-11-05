"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("")
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) setError(error.message.toLowerCase().includes("confirm") ? "Please confirm your email before signing in." : "Invalid email or password.")
    else router.push("/dashboard")
    setLoading(false)
  }

  return <main className="auth-page"><section className="auth-panel"><Link href="/" className="auth-brand"><span>COMMON</span><small>ONE</small></Link><div className="auth-copy"><p className="eyebrow">Return to signal</p><h1>Welcome back.</h1><p>Your personal intelligence workspace is ready.</p></div><form onSubmit={handleSubmit} className="auth-form"><label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label><label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button></form><div className="auth-links"><Link href="/forgot-password">Forgot password?</Link><span>New here? <Link href="/signup">Create an account</Link></span></div></section><aside className="auth-aside"><p className="eyebrow">The quiet advantage</p><blockquote>“Clarity is not more information. It is knowing what matters next.”</blockquote><span>COMMON ONE · PERSONAL INTELLIGENCE</span></aside></main>
}

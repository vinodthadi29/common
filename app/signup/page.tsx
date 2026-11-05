import Link from 'next/link'

export default function SignupPage() {
  return <main className="auth-page"><div className="auth-card"><Link className="marketing-brand" href="/">COMMON <small>ONE</small></Link><p className="common-eyebrow">Make room for what matters</p><h1>Start your private space.</h1><p className="auth-note">Sign up is intentionally disabled until the backend is approved.</p><label>Your name<input type="text" placeholder="Maya Chen" /></label><label>Email<input type="email" placeholder="you@example.com" /></label><button className="common-primary" disabled>Create space</button><p className="auth-foot">Already have a space? <Link href="/login">Sign in</Link></p></div></main>
}

import Link from 'next/link'

export default function ForgotPasswordPage() {
  return <main className="auth-page"><div className="auth-card"><Link className="marketing-brand" href="/">COMMON <small>ONE</small></Link><p className="common-eyebrow">Account access</p><h1>Reset your password.</h1><p className="auth-note">Password recovery will be connected with authentication in a later phase.</p><label>Email<input type="email" placeholder="you@example.com" /></label><button className="common-primary" disabled>Send reset link</button><p className="auth-foot"><Link href="/login">Back to sign in</Link></p></div></main>
}

import Link from 'next/link'

export default function LoginPage() {
  return <main className="auth-page"><div className="auth-card"><Link className="marketing-brand" href="/">COMMON <small>ONE</small></Link><p className="common-eyebrow">Welcome back</p><h1>Return to your space.</h1><p className="auth-note">Authentication is not enabled in this frontend preview.</p><label>Email<input type="email" placeholder="you@example.com" /></label><label>Password<input type="password" placeholder="••••••••" /></label><button className="common-primary" disabled>Continue</button><Link href="/forgot-password">Forgot password?</Link><p className="auth-foot">New here? <Link href="/signup">Create a space</Link></p></div></main>
}

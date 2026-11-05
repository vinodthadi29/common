import Link from 'next/link'

export default function AboutPage() {
  return <main className="marketing-page"><Link className="marketing-brand" href="/">COMMON <small>ONE</small></Link><div className="marketing-copy"><p className="common-eyebrow">Technology that understands life.</p><h1>A calmer way to keep up with the things that matter.</h1><p>COMMON ONE connects the small details of life into a clear, private space you can trust. This is a frontend design preview.</p><Link className="common-primary" href="/dashboard">Explore the preview</Link></div></main>
}

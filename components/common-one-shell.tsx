'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const primary = [
  { href: '/dashboard', label: 'Overview', icon: '◈' },
  { href: '/capture', label: 'Capture', icon: '＋' },
  { href: '/memory', label: 'Memory', icon: '⌁' },
  { href: '/timeline', label: 'Timeline', icon: '◷' },
]
const intelligence = [
  { href: '/prevention', label: 'Prevention', icon: '◇' },
  { href: '/actions', label: 'Actions', icon: '✓' },
  { href: '/insights', label: 'Insights', icon: '↗' },
]

const pageCopy: Record<string, { eyebrow: string; title: string; description: string }> = {
  '/dashboard': { eyebrow: 'Tuesday, November 5, 2026', title: 'Good morning, Maya.', description: "Here’s what’s happening across your life today." },
  '/capture': { eyebrow: 'Personal inbox', title: 'Capture what matters.', description: 'Bring a note, document, or thought into your personal memory.' },
  '/memory': { eyebrow: 'Your personal memory', title: 'Everything, connected.', description: 'Search across the information COMMON ONE is helping you remember.' },
  '/timeline': { eyebrow: 'Life timeline', title: 'The shape of your days.', description: 'A calm, chronological view of important moments and responsibilities.' },
  '/prevention': { eyebrow: 'Ahead of the moment', title: 'Prevent what you can.', description: 'A small set of clear signals for things that may need your attention.' },
  '/actions': { eyebrow: 'Action center', title: 'Move life forward.', description: 'The next few things worth doing, in one focused place.' },
  '/insights': { eyebrow: 'Patterns over time', title: 'See the bigger picture.', description: 'Gentle observations from the information you have chosen to keep.' },
  '/settings': { eyebrow: 'Your account', title: 'Settings', description: 'Shape how COMMON ONE works for you.' },
  '/settings/privacy': { eyebrow: 'Privacy center', title: 'Your information, your call.', description: 'Understand and control what COMMON ONE remembers.' },
}

export function CommonOneShell({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const copy = pageCopy[pathname] ?? pageCopy['/dashboard']
  const isDashboard = pathname === '/dashboard' || pathname === '/'

  return (
    <main className="common-app">
      <aside className={`common-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="common-brand"><span className="common-brand-mark">C</span><span>COMMON</span><small>ONE</small></div>
        <div className="sidebar-context"><span className="context-dot" /> Maya’s space <span>⌄</span></div>
        <p className="sidebar-label">Navigate</p>
        <nav className="common-nav" aria-label="Main navigation">
          {[...primary, ...intelligence].map((item, index) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`common-nav-item ${(pathname === item.href || (pathname === '/' && item.href === '/dashboard')) ? 'active' : ''}`}><span className="nav-glyph">{item.icon}</span>{item.label}{index === 1 && <span className="nav-pulse" />}</Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Link href="/settings" className={`common-nav-item ${pathname.startsWith('/settings') ? 'active' : ''}`}><span className="nav-glyph">⚙</span>Settings</Link>
          <div className="profile-chip"><span className="profile-avatar">MC</span><span><b>Maya Chen</b><small>Private workspace</small></span><span className="more-dots">•••</span></div>
        </div>
      </aside>
      <section className="common-main">
        <header className="common-topbar"><button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">☰</button><div className="topbar-crumb">Maya’s space <span>/</span> {copy.title.replace('Maya.', 'Overview')}</div><div className="topbar-actions"><span className="demo-pill">DESIGN PREVIEW</span><button className="circle-button" aria-label="Notifications">♧</button><span className="top-avatar">MC</span></div></header>
        <div className="common-content">
          {!isDashboard && <div className="common-page-head"><div><p className="common-eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="common-lede">{copy.description}</p></div>{pathname === '/capture' ? <Link className="common-primary" href="/dashboard">Done</Link> : null}</div>}
          {isDashboard ? <Dashboard /> : children}
        </div>
      </section>
    </main>
  )
}

function Dashboard() {
  return <>
    <div className="common-page-head"><div><p className="common-eyebrow">Tuesday, November 5, 2026 <span className="live-dot" /></p><h1>Good morning, Maya.</h1><p className="common-lede">Here’s what’s happening across your life today.</p></div><Link className="common-primary" href="/capture">＋ Quick capture</Link></div>
    <div className="demo-note">Demo content · This preview uses sample data to show the COMMON ONE experience.</div>
    <div className="signal-grid"><Signal label="Needs attention" value="03" note="1 due today" tone="violet" /><Signal label="Upcoming this week" value="07" note="Across 3 areas" tone="blue" /><Signal label="Recently remembered" value="24" note="Since Monday" tone="green" /></div>
    <div className="dashboard-layout"><section className="common-card attention-card"><CardHead title="Worth a closer look" action="See all" href="/prevention" /><div className="attention-list"><Attention icon="!" title="Passport renewal" detail="Due in 12 days · Travel" tone="warning" /><Attention icon="◌" title="Three bills arrive Friday" detail="Recurring · Household" tone="info" /><Attention icon="↗" title="Follow up with Dr. Park" detail="You mentioned this 4 days ago" tone="violet" /></div></section><section className="common-card action-card"><CardHead title="Your next best actions" action="Open actions" href="/actions" /><div className="action-list"><Action title="Upload your new insurance card" meta="Suggested · 3 min" /><Action title="Review November deadlines" meta="Today · 8 min" /><Action title="Add your Amsterdam dates" meta="When you have a moment" /></div></section></div>
    <section className="common-card timeline-card"><CardHead title="Recent memory" action="Open memory" href="/memory" /><div className="memory-row"><span className="memory-icon">▣</span><div><b>Insurance renewal letter</b><p>Captured from a photo · Today at 9:42 AM</p></div><span className="confidence">Remembered</span></div><div className="memory-row"><span className="memory-icon blue-icon">✦</span><div><b>Amsterdam trip planning</b><p>Note · Yesterday at 6:18 PM</p></div><span className="confidence">Remembered</span></div></section>
  </>
}

function Signal({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) { return <div className={`signal-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div> }
function CardHead({ title, action, href }: { title: string; action: string; href: string }) { return <div className="card-head"><div><h2>{title}</h2><p>Demo content · Personal and private</p></div><Link href={href}>{action} <span>→</span></Link></div> }
function Attention({ icon, title, detail, tone }: { icon: string; title: string; detail: string; tone: string }) { return <div className="attention-item"><span className={`attention-icon ${tone}`}>{icon}</span><span><b>{title}</b><small>{detail}</small></span><span className="row-arrow">→</span></div> }
function Action({ title, meta }: { title: string; meta: string }) { return <div className="action-item"><span className="check-circle" /><span><b>{title}</b><small>{meta}</small></span></div> }

export function PlaceholderPage({ kind }: { kind: string }) {
  const data: Record<string, { title: string; body: string; items: string[] }> = {
    capture: { title: 'Bring something in', body: 'Drop a file here or start with a thought. Nothing leaves this preview.', items: ['Drop documents, photos, or PDFs', 'Write a quick note', 'Processing status will appear here'] },
    memory: { title: 'Your memory is ready to grow', body: 'Search, browse, and connect the pieces of your life.', items: ['Search by person, place, or topic', 'Browse categorized records', 'See source references for every memory'] },
    timeline: { title: 'Your timeline is taking shape', body: 'Important moments will appear here in chronological order.', items: ['Upcoming deadlines', 'Captured moments', 'Completed responsibilities'] },
    prevention: { title: 'Three things are worth a look', body: 'These gentle signals are based on your sample information.', items: ['Overdue responsibilities', 'Conflicting information', 'Evidence behind every alert'] },
    actions: { title: 'A clear next step', body: 'Keep the important things moving without a noisy to-do list.', items: ['Set a due date', 'Choose a priority', 'Mark an action complete'] },
    insights: { title: 'Patterns, not predictions', body: 'As your memory grows, COMMON ONE will surface useful patterns here.', items: ['Activity trends', 'Resolved problems', 'Upcoming responsibilities'] },
    settings: { title: 'Make it yours', body: 'Profile and notification controls will live here.', items: ['Profile details', 'Notification preferences', 'Account controls'] },
    privacy: { title: 'Privacy by default', body: 'Your personal information should always be understandable and controllable.', items: ['Review what is remembered', 'Export your data', 'Delete your account'] },
  }
  const current = data[kind] ?? data.memory
  return <section className="empty-workspace"><span className="empty-orb">✦</span><h2>{current.title}</h2><p>{current.body}</p><div className="feature-list">{current.items.map((item, i) => <div key={item}><span>0{i + 1}</span><b>{item}</b></div>)}</div><span className="demo-badge">Demo content · Frontend preview only</span></section>
}

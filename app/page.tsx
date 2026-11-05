const navigation = ["Overview", "Accounts", "Activity", "Reports"]

const accounts = [
  { name: "Northstar Labs", owner: "Maya Chen", status: "Active", value: "$84,200", trend: "+12.4%" },
  { name: "Cinder & Co.", owner: "Jon Bell", status: "Active", value: "$62,900", trend: "+8.1%" },
  { name: "Meridian Works", owner: "Ari Patel", status: "Review", value: "$41,750", trend: "-2.3%" },
  { name: "Fieldline Studio", owner: "Sam Rivera", status: "Active", value: "$29,400", trend: "+5.7%" },
]

export default function Home() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">C</span><span>COMMON</span></div>
        <div className="workspace-label">Workspace</div>
        <button className="workspace-switcher"><span className="workspace-dot" /> Common team <span>⌄</span></button>
        <nav aria-label="Primary navigation">
          {navigation.map((item, index) => <a className={index === 0 ? "nav-item active" : "nav-item"} href={`#${item.toLowerCase()}`} key={item}><span className="nav-icon">{["◈", "◌", "↗", "▤"][index]}</span>{item}</a>)}
        </nav>
        <div className="sidebar-bottom"><a className="nav-item" href="#settings"><span className="nav-icon">⚙</span>Settings</a><div className="user-card"><div className="avatar">MC</div><div><strong>Maya Chen</strong><small>Admin</small></div><span className="more">•••</span></div></div>
      </aside>
      <section className="content">
        <header className="topbar"><div className="crumb">Workspace <span>/</span> Overview</div><div className="top-actions"><button className="icon-button" aria-label="Notifications">♧</button><button className="help-button">? <span>Help center</span></button></div></header>
        <div className="page-head"><div><p className="eyebrow">Tuesday, November 5, 2026</p><h1>Good morning, Maya.</h1><p className="lede">Here&apos;s what&apos;s happening across your workspace.</p></div><button className="primary-button">+ Add account</button></div>
        <div className="metric-grid"><Metric label="Total pipeline" value="$218,250" change="+14.8%" /><Metric label="Active accounts" value="24" change="+3 this month" /><Metric label="Tasks due" value="08" change="2 overdue" alert /><Metric label="Win rate" value="68.4%" change="+4.2%" /></div>
        <div className="dashboard-grid"><section className="panel accounts-panel"><div className="panel-head"><div><h2>Recent accounts</h2><p>Your most recently updated accounts.</p></div><a href="#accounts">View all <span>→</span></a></div><div className="table-wrap"><table><thead><tr><th>Account</th><th>Owner</th><th>Status</th><th>Value</th><th>Change</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.name}><td><strong>{account.name}</strong></td><td>{account.owner}</td><td><span className={`status ${account.status.toLowerCase()}`}><i />{account.status}</span></td><td className="value">{account.value}</td><td className={account.trend.startsWith("-") ? "negative" : "positive"}>{account.trend}</td></tr>)}</tbody></table></div></section><section className="panel activity-panel"><div className="panel-head"><div><h2>Activity</h2><p>Latest workspace updates.</p></div><a href="#activity">See all <span>→</span></a></div><div className="activity-list"><Activity initials="MC" color="lavender" title="Updated Northstar Labs" detail="2 hours ago" /><Activity initials="JB" color="peach" title="Added a note to Cinder & Co." detail="5 hours ago" /><Activity initials="AR" color="mint" title="Moved Meridian Works to review" detail="Yesterday" /><Activity initials="SR" color="yellow" title="Created a new account" detail="Yesterday" /></div></section></div>
      </section>
    </main>
  )
}

function Metric({ label, value, change, alert = false }: { label: string; value: string; change: string; alert?: boolean }) { return <div className="metric"><p>{label}</p><strong>{value}</strong><span className={alert ? "metric-change alert" : "metric-change"}>{change}</span></div> }
function Activity({ initials, color, title, detail }: { initials: string; color: string; title: string; detail: string }) { return <div className="activity"><div className={`avatar small ${color}`}>{initials}</div><div><strong>{title}</strong><small>{detail}</small></div><span className="arrow">→</span></div> }

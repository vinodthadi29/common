"use client"

import { useEffect, useState } from "react"
import { Check, Clock3, Plus, X } from "lucide-react"

type Task = { id: string; title: string; description?: string; due_at?: string; priority: number; status: string }

export function ActionCenter() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState("")
  const [due, setDue] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function load() {
    const response = await fetch("/api/actions")
    const data = await response.json()
    setTasks(data.tasks ?? [])
    if (!response.ok) setError(data.error ?? "Sign in to manage actions.")
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    fetch("/api/actions").then(async response => {
      const data = await response.json()
      if (!active) return
      setTasks(data.tasks ?? [])
      if (!response.ok) setError(data.error ?? "Sign in to manage actions.")
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  async function create() {
    if (!title.trim()) return
    const response = await fetch("/api/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, due_at: due ? new Date(due).toISOString() : null }) })
    const result = await response.json()
    if (!response.ok) { setError(result.error ?? "Unable to create task."); return }
    setTitle(""); setDue(""); setError(""); await load()
  }

  async function update(id: string, status: string) {
    await fetch("/api/actions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) })
    await load()
  }

  return <div className="action-center"><div className="action-center-head"><div><p className="common-eyebrow">Action center</p><h2>Keep the next step small.</h2></div><span className="action-count">{tasks.length} open</span></div><div className="quick-task"><input value={title} onChange={event => setTitle(event.target.value)} placeholder="Add the next smallest action" onKeyDown={event => { if (event.key === "Enter") void create() }} /><input type="datetime-local" value={due} onChange={event => setDue(event.target.value)} aria-label="Due date" /><button className="primary-button compact" onClick={() => void create()}><Plus /> Add</button></div>{error && <p className="form-error action-error">{error}</p>}{loading ? <p className="empty-state">Loading your action layer…</p> : tasks.length === 0 ? <p className="empty-state">No open actions. That is a good signal.</p> : <div className="task-list">{tasks.map(task => <div className="task-row" key={task.id}><button className="task-check" onClick={() => void update(task.id, "completed")} aria-label={`Complete ${task.title}`}><Check /></button><div className="task-copy"><strong>{task.title}</strong>{task.description && <span>{task.description}</span>}</div>{task.due_at && <span className="task-due"><Clock3 /> {new Date(task.due_at).toLocaleDateString()}</span>}<button className="task-dismiss" onClick={() => void update(task.id, "cancelled")} aria-label={`Cancel ${task.title}`}><X /></button></div>)}</div>}</div>
}

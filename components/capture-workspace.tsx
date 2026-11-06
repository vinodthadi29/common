"use client"

import { useRef, useState } from "react"
import { Check, FileAudio, FileImage, FileText, Loader2, LockKeyhole, Sparkles, UploadCloud, X } from "lucide-react"

const accepted = ".pdf,.png,.jpg,.jpeg,.txt,.docx,.mp3,.wav,.webm,.m4a"

type Capture = { id: string; title: string; mime_type: string; byte_size: number; processing_status: string }

export function CaptureWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState("")
  const [capture, setCapture] = useState<Capture | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  function choose(next: File | undefined) { if (!next) return; setFile(next); setCapture(null); setError(""); setMessage("") }
  function iconFor(type: string) { if (type.startsWith("audio/")) return <FileAudio />; if (type.startsWith("image/")) return <FileImage />; return <FileText /> }
  async function saveCapture() {
    if (!file) return
    setBusy(true); setError(""); setMessage("Uploading securely…")
    const form = new FormData(); form.append("file", file); form.append("note", note)
    const response = await fetch("/api/captures", { method: "POST", body: form }); const result = await response.json()
    if (!response.ok) { setError(result.error ?? "Upload failed."); setBusy(false); return }
    setCapture(result.capture); setMessage("Stored privately. Ready for context extraction."); setBusy(false)
  }
  async function extract() {
    if (!capture) return
    setBusy(true); setError(""); setMessage("Reading the signal…")
    const response = await fetch(`/api/captures/${capture.id}/extract`, { method: "POST" }); const result = await response.json()
    if (!response.ok) setError(result.error ?? "Extraction failed.")
    else setMessage(result.status === "needs_review" ? result.message : `Done. Found ${result.facts?.length ?? 0} facts and ${result.entities?.length ?? 0} entities.`)
    setBusy(false)
  }

  return <div className="capture-workspace"><div className="capture-toolbar"><div><p className="common-eyebrow"><span className="live-dot" />Private intake</p><h2>Bring in a signal.</h2><p>Drop a file or note here. COMMON ONE will organize it into your private context graph.</p></div><div className="capture-security"><LockKeyhole /> Encrypted storage</div></div><div className="capture-grid"><div className={`dropzone ${file ? "has-file" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); choose(event.dataTransfer.files[0]) }} onClick={() => !file && inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && inputRef.current?.click()}><input ref={inputRef} type="file" accept={accepted} hidden onChange={(event) => choose(event.target.files?.[0])} />{file ? <><div className="file-icon">{iconFor(file.type)}</div><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to store</span><button className="remove-file" onClick={(event) => { event.stopPropagation(); setFile(null); setCapture(null) }} aria-label="Remove file"><X /></button></> : <><div className="upload-orb"><UploadCloud /></div><strong>Drop anything worth remembering</strong><span>PDFs, images, text, docs, or voice notes</span><button className="secondary-button" onClick={(event) => { event.stopPropagation(); inputRef.current?.click() }}>Choose a file</button></>}</div><div className="capture-side"><label className="capture-note-label">Add a note <span>Optional context</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="What should COMMON ONE notice about this?" /></label><div className="capture-actions">{file && !capture && <button className="primary-button" onClick={saveCapture} disabled={busy}>{busy ? <Loader2 className="spin" /> : <LockKeyhole />} {busy ? "Storing…" : "Store privately"}</button>}{capture && <button className="primary-button" onClick={extract} disabled={busy}>{busy ? <Loader2 className="spin" /> : <Sparkles />} {busy ? "Extracting…" : "Extract context"}</button>}</div>{message && <p className="capture-message"><Check /> {message}</p>}{error && <p className="form-error">{error}</p>}</div></div></div>
}

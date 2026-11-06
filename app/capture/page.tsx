import { CommonOneShell } from '@/components/common-one-shell'
import { CaptureWorkspace } from '@/components/capture-workspace'

export default function CapturePage() {
  return <CommonOneShell><div className="common-page-head"><div><p className="common-eyebrow"><span className="live-dot" />Universal capture</p><h1>Capture</h1><p className="common-lede">One place for the inputs that shape your life.</p></div></div><CaptureWorkspace /></CommonOneShell>
}

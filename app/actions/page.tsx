import { CommonOneShell } from '@/components/common-one-shell'
import { ActionCenter } from '@/components/action-center'
import { NotificationPreferences } from '@/components/notification-preferences'
export default function ActionsPage(){return <CommonOneShell><div className="common-page-head"><div><p className="common-eyebrow">Execution layer</p><h1>Actions</h1><p className="common-lede">Turn context into the next clear move.</p></div></div><ActionCenter/><NotificationPreferences/></CommonOneShell>}

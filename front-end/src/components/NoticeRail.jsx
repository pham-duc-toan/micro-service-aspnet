import { Loader2 } from 'lucide-react'

export function NoticeRail({ busy, alerts }) {
  return (
    <div className="noticeRail">
      {busy.count > 0 ? (
        <div className="busyBadge">
          <Loader2 size={14} className="spin" />
          <span>{busy.label}</span>
        </div>
      ) : null}
      {alerts.map((alert) => (
        <div key={alert.id} className={`notice ${alert.tone}`}>
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  )
}

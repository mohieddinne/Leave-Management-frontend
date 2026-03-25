import type { LeaveStatus } from '../../types'

export function StatusBadge({ status }: { status: LeaveStatus }) {
  const map: Record<LeaveStatus, { label: string; cls: string }> = {
    PENDING:   { label: 'En attente', cls: 'badge-pending' },
    APPROVED:  { label: 'Approuvé',   cls: 'badge-approved' },
    REJECTED:  { label: 'Rejeté',     cls: 'badge-rejected' },
    CANCELLED: { label: 'Annulé',     cls: 'badge-cancelled' },
  }
  const { label, cls } = map[status] ?? { label: status, cls: 'badge-pending' }
  return <span className={cls}>{label}</span>
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="badge-approved">Actif</span>
  ) : (
    <span className="badge-cancelled">Inactif</span>
  )
}

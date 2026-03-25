import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { leaveRequestApi, departmentApi } from '../services/api'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import { StatusBadge } from '../components/shared/Badges'
import type { LeaveRequest, Department } from '../types'
import { HiX } from 'react-icons/hi'

// ── Localizer (date-fns) ────────────────────────────────────────────────────
const locales = { fr }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: (clampedDate: Date) => startOfWeek(clampedDate, { weekStartsOn: 1 }), getDay, locales })

// ── Messages FR ─────────────────────────────────────────────────────────────
const messages = {
  allDay: 'Toute la journée', previous: '‹', next: '›', today: "Aujourd'hui",
  month: 'Mois', week: 'Semaine', day: 'Jour', agenda: 'Agenda',
  date: 'Date', time: 'Heure', event: 'Événement',
  noEventsInRange: 'Aucun congé sur cette période.',
  showMore: (total: number) => `+ ${total} autre(s)`,
}

// ── Types ────────────────────────────────────────────────────────────────────
interface CalEvent {
  id: number
  title: string
  start: Date
  end: Date
  resource: LeaveRequest
}

// ── Colour helpers ────────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  PENDING: '#eab308', APPROVED: '#22c55e', REJECTED: '#ef4444', CANCELLED: '#9ca3af',
}
function eventStyleGetter(event: CalEvent) {
  const req = event.resource
  const bg = req.leaveType?.colorCode ?? statusColor[req.status] ?? '#3b82f6'
  return { style: { backgroundColor: bg, borderColor: bg, color: '#fff', borderRadius: '4px', fontSize: '12px', padding: '1px 4px' } }
}

// ── Event tooltip component ──────────────────────────────────────────────────
function EventDetail({ event, onClose }: { event: CalEvent; onClose: () => void }) {
  const req = event.resource
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Détail du congé</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><HiX className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Employé</span><span className="font-medium">{req.employee?.firstName} {req.employee?.lastName}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Type</span>
            <span className="flex items-center gap-1.5">
              {req.leaveType?.colorCode && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: req.leaveType.colorCode }} />}
              {req.leaveType?.name}
            </span>
          </div>
          <div className="flex justify-between"><span className="text-gray-500">Début</span><span className="font-medium">{req.startDate}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Fin</span><span className="font-medium">{req.endDate}</span></div>
          {req.numberOfDays && <div className="flex justify-between"><span className="text-gray-500">Durée</span><span className="font-medium">{req.numberOfDays} jour(s)</span></div>}
          <div className="flex justify-between items-center"><span className="text-gray-500">Statut</span><StatusBadge status={req.status} /></div>
          {req.reason && <div><span className="text-gray-500 block mb-0.5">Motif</span><p className="text-gray-700 bg-gray-50 rounded p-2">{req.reason}</p></div>}
          {req.managerComment && <div><span className="text-gray-500 block mb-0.5">Commentaire manager</span><p className="text-gray-700 bg-gray-50 rounded p-2">{req.managerComment}</p></div>}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('APPROVED,PENDING')
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)

  useEffect(() => {
    Promise.all([leaveRequestApi.getAll(), departmentApi.getAll()])
      .then(([reqs, depts]) => { setRequests(reqs.data); setDepartments(depts.data) })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  // Convert leave requests to calendar events
  const events: CalEvent[] = requests
    .filter(r => {
      const statusMatch = statusFilter.split(',').includes(r.status)
      const deptMatch = !deptFilter || String(r.employee?.department?.id) === deptFilter
      return statusMatch && deptMatch
    })
    .map(r => ({
      id: r.id,
      title: `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''} — ${r.leaveType?.name ?? ''}`,
      start: new Date(r.startDate + 'T00:00:00'),
      end: new Date(r.endDate + 'T23:59:59'),
      resource: r,
    }))

  const handleSelectEvent = useCallback((event: CalEvent) => setSelectedEvent(event), [])
  const handleSelectSlot = useCallback((_slot: SlotInfo) => { /* reserved for future: create request from slot */ }, [])

  const statusOptions = [
    { value: 'APPROVED,PENDING', label: 'Approuvés + En attente' },
    { value: 'APPROVED', label: 'Approuvés only' },
    { value: 'PENDING', label: 'En attente only' },
    { value: 'APPROVED,PENDING,REJECTED,CANCELLED', label: 'Tous' },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendrier d'équipe</h1>
          <p className="text-gray-500 text-sm mt-1">{events.length} congé(s) affiché(s)</p>
        </div>
        <div className="flex gap-3">
          <select className="input-field w-52" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">Tous les départements</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="input-field w-52" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap text-xs">
        {[['#22c55e','Approuvé'],['#eab308','En attente'],['#ef4444','Rejeté'],['#9ca3af','Annulé']].map(([color,label]) => (
          <span key={label} className="flex items-center gap-1.5 text-gray-600">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />{label}
          </span>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="mt-20" />
      ) : (
        <div className="card p-0 overflow-hidden" style={{ height: '650px' }}>
          <div className="p-4 h-full">
            <Calendar<CalEvent>
              localizer={localizer}
              events={events}
              view={view}
              date={date}
              onView={setView}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              messages={messages}
              culture="fr"
              popup
              showMultiDayTimes
              style={{ height: '100%' }}
              tooltipAccessor={e => e.title}
            />
          </div>
        </div>
      )}

      {selectedEvent && <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  )
}


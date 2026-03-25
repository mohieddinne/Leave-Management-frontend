import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { leaveRequestApi, employeeApi, leaveTypeApi } from '../services/api'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { StatusBadge } from '../components/shared/Badges'
import type { LeaveRequest, Employee, LeaveType, LeaveStatus, LeaveRequestDto } from '../types'
import { HiPlus, HiCheck, HiX, HiTrash, HiFilter, HiClipboardList } from 'react-icons/hi'

const statusOptions: Array<'' | LeaveStatus> = ['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
const statusLabel: Record<string, string> = { 
  '': 'Tous', 
  PENDING: 'En attente', 
  APPROVED: 'Approuvés', 
  REJECTED: 'Rejetés', 
  CANCELLED: 'Annulés' 
}

function RequestForm({ employees, leaveTypes, onSubmit, onCancel }: {
  employees: Employee[]
  leaveTypes: LeaveType[]
  onSubmit: (d: LeaveRequestDto) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({ 
    employeeId: '', 
    leaveTypeId: '', 
    startDate: '', 
    endDate: '', 
    halfDayStart: false, 
    halfDayEnd: false, 
    reason: '', 
    isEmergency: false, 
    contactInfo: '' 
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
    setForm(f => ({ ...f, [k]: e.target.value }))
  
  const toggle = (k: string) => () => 
    setForm(f => ({ ...f, [k]: !(f as Record<string, unknown>)[k] }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation (optionnelle)
    if (!form.employeeId || !form.leaveTypeId) {
      toast.error('Veuillez sélectionner un employé et un type de congé')
      return
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error('La date de fin doit être après la date de début')
      return
    }

    const payload: LeaveRequestDto = {
      employeeId: Number(form.employeeId),
      leaveTypeId: Number(form.leaveTypeId),
      startDate: form.startDate,
      endDate: form.endDate,
      halfDayStart: form.halfDayStart,
      halfDayEnd: form.halfDayEnd,
      isEmergency: form.isEmergency,
      ...(form.reason.trim() && { reason: form.reason.trim() }),
      ...(form.contactInfo.trim() && { contactInfo: form.contactInfo.trim() })
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Employé *</label>
        <select className="input-field" required value={form.employeeId} onChange={set('employeeId')}>
          <option value="">-- Sélectionner --</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Type de congé *</label>
        <select className="input-field" required value={form.leaveTypeId} onChange={set('leaveTypeId')}>
          <option value="">-- Sélectionner --</option>
          {leaveTypes.map(lt => (
            <option key={lt.id} value={lt.id}>
              {lt.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Début *</label>
          <input 
            className="input-field" 
            type="date" 
            required 
            value={form.startDate} 
            onChange={set('startDate')} 
          />
        </div>
        <div>
          <label className="label">Fin *</label>
          <input 
            className="input-field" 
            type="date" 
            required 
            value={form.endDate} 
            onChange={set('endDate')} 
          />
        </div>
      </div>

      <div>
        <label className="label">Motif</label>
        <textarea 
          className="input-field resize-none" 
          rows={2} 
          value={form.reason} 
          onChange={set('reason')} 
          placeholder="Raison de la demande (optionnel)"
        />
      </div>

      <div>
        <label className="label">Contact d'urgence</label>
        <input 
          className="input-field" 
          value={form.contactInfo} 
          onChange={set('contactInfo')} 
          placeholder="Numéro ou email (optionnel)"
        />
      </div>

      <div className="flex gap-4 flex-wrap">
        {[
          ['halfDayStart', 'Demi-journée début'], 
          ['halfDayEnd', 'Demi-journée fin'], 
          ['isEmergency', 'Urgence']
        ].map(([k, l]) => (
          <label key={k} className="flex items-center gap-2 cursor-pointer text-sm">
            <input 
              type="checkbox" 
              checked={!!(form as Record<string, unknown>)[k]} 
              onChange={toggle(k)} 
              className="rounded" 
            />
            {l}
          </label>
        ))}
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="btn-primary">
          Soumettre
        </button>
      </div>
    </form>
  )
}

function CommentModal({ title, onSubmit, onCancel }: { 
  title: string
  onSubmit: (c: string) => void
  onCancel: () => void 
}) {
  const [comment, setComment] = useState('')
  
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(comment) }} className="space-y-4">
      <div>
        <label className="label">Commentaire</label>
        <textarea 
          className="input-field resize-none" 
          rows={3} 
          value={comment} 
          onChange={e => setComment(e.target.value)} 
          placeholder="Ajouter un commentaire (optionnel)"
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="btn-primary">
          {title}
        </button>
      </div>
    </form>
  )
}

type ModalState = 'create' | { type: 'approve' | 'reject' | 'cancel'; req: LeaveRequest } | null

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'' | LeaveStatus>('')
  const [modal, setModal] = useState<ModalState>(null)

  const load = async () => {
    try {
      const [reqs, emps, types] = await Promise.all([
        leaveRequestApi.getAll(), 
        employeeApi.getAll(), 
        leaveTypeApi.getActive().catch(() => leaveTypeApi.getAll())
      ])
      setRequests(reqs.data)
      setEmployees(emps.data)
      setLeaveTypes(types.data)
    } catch (error) {
      console.error('Erreur de chargement:', error)
      toast.error('Erreur de chargement des données')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const displayRequests = statusFilter 
    ? requests.filter(r => r.status === statusFilter) 
    : requests

  const handleCreate = async (payload: LeaveRequestDto) => {
    try {
      await leaveRequestApi.create(payload)
      toast.success('Demande soumise avec succès')
      setModal(null)
      load()
    } catch (error: unknown) {
      console.error('Erreur création:', error)
      // ✅ Meilleure gestion des erreurs
      const message = error instanceof Error 
        ? error.message 
        : 'Erreur lors de la création de la demande'
      toast.error(message)
    }
  }

  const handleApprove = async (comment: string) => {
    if (typeof modal !== 'object' || modal === null || modal.type !== 'approve') return
    try {
      await leaveRequestApi.approve(modal.req.id, comment)
      toast.success('Demande approuvée')
      setModal(null)
      load()
    } catch (error: unknown) {
      console.error('Erreur approbation:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'approbation')
    }
  }

  const handleReject = async (comment: string) => {
    if (typeof modal !== 'object' || modal === null || modal.type !== 'reject') return
    try {
      await leaveRequestApi.reject(modal.req.id, comment)
      toast.success('Demande rejetée')
      setModal(null)
      load()
    } catch (error: unknown) {
      console.error('Erreur rejet:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du rejet')
    }
  }

  const handleCancel = async () => {
    if (typeof modal !== 'object' || modal === null || modal.type !== 'cancel') return
    try {
      await leaveRequestApi.cancel(modal.req.id)
      toast.success('Demande annulée')
      setModal(null)
      load()
    } catch (error: unknown) {
      console.error('Erreur annulation:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'annulation')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandes de Congés</h1>
          <p className="text-gray-500 text-sm mt-1">
            {requests.length} demande(s) • {displayRequests.length} affichée(s)
          </p>
        </div>
        <button 
          className="btn-primary flex items-center gap-2" 
          onClick={() => setModal('create')}
        >
          <HiPlus className="w-4 h-4" /> Nouvelle demande
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <HiFilter className="text-gray-400 w-4 h-4" />
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map(s => (
            <button 
              key={s} 
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="mt-20" />
      ) : displayRequests.length === 0 ? (
        <div className="card text-center py-16">
          <HiClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {statusFilter ? `Aucune demande ${statusLabel[statusFilter].toLowerCase()}` : 'Aucune demande'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Employé', 'Type', 'Période', 'Jours', 'Statut', ''].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRequests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    {req.employee?.firstName} {req.employee?.lastName}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      {req.leaveType?.colorCode && (
                        <span 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: req.leaveType.colorCode }} 
                        />
                      )}
                      {req.leaveType?.name ?? '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {req.startDate} → {req.endDate}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {req.numberOfDays ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 justify-end">
                      {req.status === 'PENDING' && (
                        <>
                          <button 
                            title="Approuver" 
                            onClick={() => setModal({ type: 'approve', req })} 
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <HiCheck className="w-4 h-4" />
                          </button>
                          <button 
                            title="Rejeter" 
                            onClick={() => setModal({ type: 'reject', req })} 
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <HiX className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {(req.status === 'PENDING' || req.status === 'APPROVED') && (
                        <button 
                          title="Annuler" 
                          onClick={() => setModal({ type: 'cancel', req })} 
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal 
        isOpen={modal === 'create'} 
        onClose={() => setModal(null)} 
        title="Nouvelle demande de congé" 
        maxWidth="max-w-xl"
      >
        <RequestForm 
          employees={employees} 
          leaveTypes={leaveTypes} 
          onSubmit={handleCreate} 
          onCancel={() => setModal(null)} 
        />
      </Modal>

      <Modal 
        isOpen={typeof modal === 'object' && modal !== null && modal.type === 'approve'} 
        onClose={() => setModal(null)} 
        title="Approuver la demande"
      >
        <CommentModal 
          title="Approuver" 
          onSubmit={handleApprove} 
          onCancel={() => setModal(null)} 
        />
      </Modal>

      <Modal 
        isOpen={typeof modal === 'object' && modal !== null && modal.type === 'reject'} 
        onClose={() => setModal(null)} 
        title="Rejeter la demande"
      >
        <CommentModal 
          title="Rejeter" 
          onSubmit={handleReject} 
          onCancel={() => setModal(null)} 
        />
      </Modal>

      <ConfirmDialog 
        isOpen={typeof modal === 'object' && modal !== null && modal.type === 'cancel'} 
        onClose={() => setModal(null)} 
        onConfirm={handleCancel}
        title="Annuler la demande" 
        message="Êtes-vous sûr de vouloir annuler cette demande ?" 
        confirmLabel="Annuler la demande" 
        danger 
      />
    </div>
  )
}

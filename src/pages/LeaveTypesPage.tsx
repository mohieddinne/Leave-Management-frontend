import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { leaveTypeApi } from '../services/api'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { ActiveBadge } from '../components/shared/Badges'
import type { LeaveType, LeaveTypeDto } from '../types'
import { HiPlus, HiPencil, HiTrash, HiTag } from 'react-icons/hi'

const defaultForm: LeaveTypeDto = {
  name:'', description:'', paidLeave:true, defaultDaysPerYear:22,
  colorCode:'#3b82f6', requiresDocumentation:false,
  canCarryOver:false, maxCarryOverDays:0, minNoticeDays:0, allowHalfDay:true, active:true,
}

function LeaveTypeForm({ initial, onSubmit, onCancel }: {
  initial?: LeaveTypeDto; onSubmit: (d: LeaveTypeDto) => void; onCancel: () => void
}) {
  const [form, setForm] = useState<LeaveTypeDto>(initial ?? defaultForm)
  const set = (k: keyof LeaveTypeDto) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))
  const setNum = (k: keyof LeaveTypeDto) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: Number(e.target.value) }))
  const toggle = (k: keyof LeaveTypeDto) => () => setForm(f => ({ ...f, [k]: !f[k] }))
  const toggleKeys: (keyof LeaveTypeDto)[] = ['paidLeave','requiresDocumentation','canCarryOver','allowHalfDay','active']
  const toggleLabels: Record<string,string> = { paidLeave:'Congé payé', requiresDocumentation:'Justificatif requis', canCarryOver:'Report possible', allowHalfDay:'Demi-journée', active:'Actif' }
  return (
    <form onSubmit={e=>{ e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">Nom *</label><input className="input-field" required value={form.name} onChange={set('name')} /></div>
        <div className="col-span-2"><label className="label">Description</label><textarea className="input-field resize-none" rows={2} value={form.description??''} onChange={set('description')} /></div>
        <div><label className="label">Jours par an</label><input className="input-field" type="number" min={0} value={form.defaultDaysPerYear} onChange={setNum('defaultDaysPerYear')} /></div>
        <div><label className="label">Avis minimum (jours)</label><input className="input-field" type="number" min={0} value={form.minNoticeDays} onChange={setNum('minNoticeDays')} /></div>
        <div><label className="label">Couleur</label><input className="input-field" type="color" value={form.colorCode??'#3b82f6'} onChange={set('colorCode')} /></div>
        <div><label className="label">Report max (jours)</label><input className="input-field" type="number" min={0} value={form.maxCarryOverDays} onChange={setNum('maxCarryOverDays')} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2">
        {toggleKeys.map(k => (
          <label key={k} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!form[k]} onChange={toggle(k)} className="rounded" />
            <span className="text-sm text-gray-700">{toggleLabels[k]}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn-primary">Enregistrer</button>
      </div>
    </form>
  )
}

type ModalState = 'create' | { type: 'edit'; lt: LeaveType } | { type: 'delete'; lt: LeaveType } | null

export default function LeaveTypesPage() {
  const [types, setTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>(null)

  const load = async () => {
    try { const { data } = await leaveTypeApi.getAll(); setTypes(data) }
    catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleCreate = async (form: LeaveTypeDto) => {
    try { await leaveTypeApi.create(form); toast.success('Type créé'); setModal(null); load() }
    catch (e: unknown) { toast.error((e as Error).message) }
  }
  const handleEdit = async (form: LeaveTypeDto) => {
    if (typeof modal !== 'object' || modal === null || modal.type !== 'edit') return
    try { await leaveTypeApi.update(modal.lt.id, form); toast.success('Type mis à jour'); setModal(null); load() }
    catch (e: unknown) { toast.error((e as Error).message) }
  }
  const handleDelete = async () => {
    if (typeof modal !== 'object' || modal === null || modal.type !== 'delete') return
    try { await leaveTypeApi.delete(modal.lt.id); toast.success('Type supprimé'); load() }
    catch (e: unknown) { toast.error((e as Error).message) }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Types de Congés</h1><p className="text-gray-500 text-sm mt-1">{types.length} type(s)</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal('create')}><HiPlus className="w-4 h-4" /> Nouveau type</button>
      </div>
      {loading ? <LoadingSpinner size="lg" className="mt-20" /> : types.length === 0 ? (
        <div className="card text-center py-16"><HiTag className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun type de congé.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map(lt => (
            <div key={lt.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-4 h-10 rounded flex-shrink-0" style={{ backgroundColor: lt.colorCode ?? '#3b82f6' }} />
                  <div className="min-w-0"><h3 className="font-semibold text-gray-900 truncate">{lt.name}</h3><p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{lt.description}</p></div>
                </div>
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  <button onClick={() => setModal({ type:'edit', lt })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><HiPencil className="w-4 h-4" /></button>
                  <button onClick={() => setModal({ type:'delete', lt })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><HiTrash className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div><p className="font-semibold text-gray-900">{lt.defaultDaysPerYear}</p><p className="text-gray-500">Jours/an</p></div>
                <div><p className="font-semibold text-gray-900">{lt.paidLeave ? '✓' : '✗'}</p><p className="text-gray-500">Payé</p></div>
                <div><ActiveBadge active={lt.active !== false} /></div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={modal === 'create'} onClose={() => setModal(null)} title="Nouveau type de congé" maxWidth="max-w-xl">
        <LeaveTypeForm onSubmit={handleCreate} onCancel={() => setModal(null)} />
      </Modal>
      <Modal isOpen={typeof modal === 'object' && modal !== null && modal.type === 'edit'} onClose={() => setModal(null)} title="Modifier le type" maxWidth="max-w-xl">
        {typeof modal === 'object' && modal !== null && modal.type === 'edit' && (
          <LeaveTypeForm initial={modal.lt} onSubmit={handleEdit} onCancel={() => setModal(null)} />
        )}
      </Modal>
      <ConfirmDialog isOpen={typeof modal === 'object' && modal !== null && modal.type === 'delete'} onClose={() => setModal(null)} onConfirm={handleDelete}
        title="Supprimer le type" message={`Supprimer "${typeof modal === 'object' && modal !== null && modal.type === 'delete' ? modal.lt.name : ''}" ?`} confirmLabel="Supprimer" danger />
    </div>
  )
}

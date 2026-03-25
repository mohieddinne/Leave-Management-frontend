import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { departmentApi } from '../services/api'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import type { Department, DepartmentDto } from '../types'
import { HiPlus, HiPencil, HiTrash, HiOfficeBuilding } from 'react-icons/hi'

function DeptForm({ initial, onSubmit, onCancel }: {
  initial?: DepartmentDto; onSubmit: (d: DepartmentDto) => void; onCancel: () => void
}) {
  const [form, setForm] = useState<DepartmentDto>(initial ?? { name: '', description: '' })
  const set = (k: keyof DepartmentDto) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div>
        <label className="label">Nom *</label>
        <input className="input-field" required value={form.name} onChange={set('name')} placeholder="Nom du département" />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input-field resize-none" rows={3} value={form.description ?? ''} onChange={set('description')} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn-primary">Enregistrer</button>
      </div>
    </form>
  )
}

type ModalState = 'create' | { type: 'edit'; dept: Department } | { type: 'delete'; dept: Department } | null

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>(null)

  const load = async () => {
    try { const { data } = await departmentApi.getAll(); setDepartments(data) }
    catch { toast.error('Impossible de charger les départements') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleCreate = async (form: DepartmentDto) => {
    try { await departmentApi.create(form); toast.success('Département créé'); setModal(null); load() }
    catch (e: unknown) { toast.error((e as Error).message) }
  }
  const handleEdit = async (form: DepartmentDto) => {
    if (typeof modal !== 'object' || modal === null || modal.type !== 'edit') return
    try { await departmentApi.update(modal.dept.id, form); toast.success('Département mis à jour'); setModal(null); load() }
    catch (e: unknown) { toast.error((e as Error).message) }
  }
  const handleDelete = async () => {
    if (typeof modal !== 'object' || modal === null || modal.type !== 'delete') return
    try { await departmentApi.delete(modal.dept.id); toast.success('Département supprimé'); load() }
    catch (e: unknown) { toast.error((e as Error).message) }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Départements</h1>
          <p className="text-gray-500 text-sm mt-1">{departments.length} département(s)</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal('create')}>
          <HiPlus className="w-4 h-4" /> Nouveau département
        </button>
      </div>
      {loading ? <LoadingSpinner size="lg" className="mt-20" /> : departments.length === 0 ? (
        <div className="card text-center py-16">
          <HiOfficeBuilding className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun département. Créez le premier !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(dept => (
            <div key={dept.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <HiOfficeBuilding className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <h3 className="font-semibold text-gray-900 truncate">{dept.name}</h3>
                  </div>
                  {dept.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{dept.description}</p>}
                </div>
                <div className="flex gap-1 ml-3 flex-shrink-0">
                  <button onClick={() => setModal({ type: 'edit', dept })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><HiPencil className="w-4 h-4" /></button>
                  <button onClick={() => setModal({ type: 'delete', dept })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><HiTrash className="w-4 h-4" /></button>
                </div>
              </div>
              {dept.createdAt && <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">Créé le {dept.createdAt.split('T')[0]}</p>}
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={modal === 'create'} onClose={() => setModal(null)} title="Nouveau département">
        <DeptForm onSubmit={handleCreate} onCancel={() => setModal(null)} />
      </Modal>
      <Modal isOpen={typeof modal === 'object' && modal !== null && modal.type === 'edit'} onClose={() => setModal(null)} title="Modifier le département">
        {typeof modal === 'object' && modal !== null && modal.type === 'edit' && (
          <DeptForm initial={modal.dept} onSubmit={handleEdit} onCancel={() => setModal(null)} />
        )}
      </Modal>
      <ConfirmDialog
        isOpen={typeof modal === 'object' && modal !== null && modal.type === 'delete'}
        onClose={() => setModal(null)} onConfirm={handleDelete}
        title="Supprimer le département"
        message={`Supprimer "${typeof modal === 'object' && modal !== null && modal.type === 'delete' ? modal.dept.name : ''}" ?`}
        confirmLabel="Supprimer" danger
      />
    </div>
  )
}

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { employeeApi, departmentApi } from '../services/api'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import type { Employee, Department } from '../types'
import { HiPlus, HiPencil, HiTrash, HiUser, HiSearch } from 'react-icons/hi'

interface EmpFormState {
  firstName: string; lastName: string; email: string
  jobTitle: string; hireDate: string; departmentId: string
}

function EmployeeForm({ initial, departments, onSubmit, onCancel }: {
  initial?: EmpFormState; departments: Department[]
  onSubmit: (p: object) => void; onCancel: () => void
}) {
  const [form, setForm] = useState<EmpFormState>(initial ?? { firstName:'', lastName:'', email:'', jobTitle:'', hireDate:'', departmentId:'' })
  const set = (k: keyof EmpFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = { firstName: form.firstName, lastName: form.lastName, email: form.email, jobTitle: form.jobTitle, hireDate: form.hireDate }
    if (form.departmentId) payload.department = { id: Number(form.departmentId) }
    onSubmit(payload)
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Prénom *</label><input className="input-field" required value={form.firstName} onChange={set('firstName')} /></div>
        <div><label className="label">Nom *</label><input className="input-field" required value={form.lastName} onChange={set('lastName')} /></div>
      </div>
      <div><label className="label">Email *</label><input className="input-field" type="email" required value={form.email} onChange={set('email')} /></div>
      <div><label className="label">Poste</label><input className="input-field" value={form.jobTitle} onChange={set('jobTitle')} /></div>
      <div><label className="label">Date d'embauche</label><input className="input-field" type="date" value={form.hireDate} onChange={set('hireDate')} /></div>
      <div>
        <label className="label">Département</label>
        <select className="input-field" value={form.departmentId} onChange={set('departmentId')}>
          <option value="">-- Sélectionner --</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn-primary">Enregistrer</button>
      </div>
    </form>
  )
}

type ModalState = 'create' | { type: 'edit'; emp: Employee } | { type: 'delete'; emp: Employee } | null

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>(null)

  const load = async () => {
    try { const [emps, depts] = await Promise.all([employeeApi.getAll(), departmentApi.getAll()]); setEmployees(emps.data); setDepartments(depts.data) }
    catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = employees.filter(e => {
    const q = search.toLowerCase()
    return e.firstName?.toLowerCase().includes(q) || e.lastName?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.jobTitle?.toLowerCase().includes(q)
  })

  const handleCreate = async (payload: object) => {
    try { await employeeApi.create(payload as never); toast.success('Employé créé'); setModal(null); load() }
    catch (e: unknown) { toast.error((e as Error).message) }
  }
  const handleEdit = async (payload: object) => {
    if (typeof modal !== 'object' || modal === null || modal.type !== 'edit') return
    try { await employeeApi.update(modal.emp.id, payload as never); toast.success('Employé mis à jour'); setModal(null); load() }
    catch (e: unknown) { toast.error((e as Error).message) }
  }
  const handleDelete = async () => {
    if (typeof modal !== 'object' || modal === null || modal.type !== 'delete') return
    try { await employeeApi.delete(modal.emp.id); toast.success('Employé supprimé'); load() }
    catch (e: unknown) { toast.error((e as Error).message) }
  }
  const getInitials = (emp: Employee) => `${emp.firstName?.[0] ?? ''}${emp.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Employés</h1><p className="text-gray-500 text-sm mt-1">{employees.length} employé(s)</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal('create')}><HiPlus className="w-4 h-4" /> Nouvel employé</button>
      </div>
      <div className="relative mb-6">
        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input className="input-field pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {loading ? <LoadingSpinner size="lg" className="mt-20" /> : filtered.length === 0 ? (
        <div className="card text-center py-16"><HiUser className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun employé.</p></div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Employé','Email','Poste','Département','Embauche',''].map(h => <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">{getInitials(emp)}</div>
                      <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{emp.email}</td>
                  <td className="px-6 py-4 text-gray-600">{emp.jobTitle || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{emp.department?.name || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{emp.hireDate || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setModal({ type: 'edit', emp })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><HiPencil className="w-4 h-4" /></button>
                      <button onClick={() => setModal({ type: 'delete', emp })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><HiTrash className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal isOpen={modal === 'create'} onClose={() => setModal(null)} title="Nouvel employé">
        <EmployeeForm departments={departments} onSubmit={handleCreate} onCancel={() => setModal(null)} />
      </Modal>
      <Modal isOpen={typeof modal === 'object' && modal !== null && modal.type === 'edit'} onClose={() => setModal(null)} title="Modifier l'employé">
        {typeof modal === 'object' && modal !== null && modal.type === 'edit' && (
          <EmployeeForm initial={{ ...modal.emp, jobTitle: modal.emp.jobTitle??'', hireDate: modal.emp.hireDate??'', departmentId: String(modal.emp.department?.id??'') }} departments={departments} onSubmit={handleEdit} onCancel={() => setModal(null)} />
        )}
      </Modal>
      <ConfirmDialog isOpen={typeof modal === 'object' && modal !== null && modal.type === 'delete'} onClose={() => setModal(null)} onConfirm={handleDelete}
        title="Supprimer l'employé" message={`Supprimer ${typeof modal === 'object' && modal !== null && modal.type === 'delete' ? `${modal.emp.firstName} ${modal.emp.lastName}` : ''} ?`} confirmLabel="Supprimer" danger />
    </div>
  )
}

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { leaveBalanceApi, employeeApi, leaveTypeApi } from '../services/api'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import Modal from '../components/shared/Modal'
import type { Employee, LeaveType, LeaveBalance } from '../types'
import { HiChartBar, HiRefresh } from 'react-icons/hi'

function BalanceBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0
  const color = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500'
  return <div className="w-full bg-gray-100 rounded-full h-2"><div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} /></div>
}

function InitForm({ employees, leaveTypes, onSubmit, onCancel }: {
  employees: Employee[]; leaveTypes: LeaveType[]
  onSubmit: (f: { employeeId: string; leaveTypeId: string; year: number }) => void; onCancel: () => void
}) {
  const [form, setForm] = useState({ employeeId:'', leaveTypeId:'', year: new Date().getFullYear() })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, year: Number(form.year) }) }} className="space-y-4">
      <div><label className="label">Employé *</label>
        <select className="input-field" required value={form.employeeId} onChange={set('employeeId')}>
          <option value="">-- Sélectionner --</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
        </select>
      </div>
      <div><label className="label">Type de congé *</label>
        <select className="input-field" required value={form.leaveTypeId} onChange={set('leaveTypeId')}>
          <option value="">-- Sélectionner --</option>
          {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
        </select>
      </div>
      <div><label className="label">Année *</label><input className="input-field" type="number" required value={form.year} onChange={set('year')} /></div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn-primary">Initialiser</button>
      </div>
    </form>
  )
}

export default function LeaveBalancesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingInit, setLoadingInit] = useState(true)
  const [modal, setModal] = useState(false)

  useEffect(() => {
    Promise.all([employeeApi.getAll(), leaveTypeApi.getAll()])
      .then(([emps, types]) => { setEmployees(emps.data); setLeaveTypes(types.data) })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoadingInit(false))
  }, [])

  const loadBalances = async (empId: string) => {
    if (!empId) return
    setLoading(true)
    try { const { data } = await leaveBalanceApi.getByEmployee(Number(empId)); setBalances(Array.isArray(data) ? data : [data]) }
    catch { setBalances([]); toast.error('Impossible de charger les soldes') }
    finally { setLoading(false) }
  }

  const handleInit = async (form: { employeeId: string; leaveTypeId: string; year: number }) => {
    try {
      await leaveBalanceApi.initialize({ employeeId: Number(form.employeeId), leaveTypeId: Number(form.leaveTypeId), year: form.year })
      toast.success('Solde initialisé'); setModal(false)
      if (selectedEmployee) loadBalances(selectedEmployee)
    } catch (e: unknown) { toast.error((e as Error).message) }
  }

  const currentYear = new Date().getFullYear()
  const yearBalances = balances.filter(b => b.year === currentYear)
  const otherBalances = balances.filter(b => b.year !== currentYear)

  const BalanceCard = ({ b, faded = false }: { b: LeaveBalance; faded?: boolean }) => {
    const total = b.totalDays ?? b.allocatedDays ?? 0
    const used = b.usedDays ?? 0
    const remaining = b.remainingDays ?? (total - used)
    return (
      <div className={`card ${faded ? 'opacity-75' : ''}`}>
        {!faded && (
          <>
            <div className="flex items-center gap-2 mb-3">
              {b.leaveType?.colorCode && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.leaveType.colorCode }} />}
              <h3 className="font-semibold text-gray-900">{b.leaveType?.name ?? 'Congé'}</h3>
            </div>
            <BalanceBar used={used} total={total} />
            <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
              <div><p className="font-bold text-gray-900 text-lg">{total}</p><p className="text-gray-500">Total</p></div>
              <div><p className="font-bold text-red-500 text-lg">{used}</p><p className="text-gray-500">Utilisés</p></div>
              <div><p className={`font-bold text-lg ${remaining <= 5 ? 'text-red-500' : 'text-green-600'}`}>{remaining}</p><p className="text-gray-500">Restants</p></div>
            </div>
            {remaining <= 5 && remaining > 0 && <p className="text-xs text-red-500 mt-2 text-center">⚠ Solde faible</p>}
          </>
        )}
        {faded && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-700">{b.leaveType?.name ?? 'Congé'}</h3>
              <span className="text-xs text-gray-400">{b.year}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Restants: <strong>{remaining}</strong></span>
              <span className="text-gray-500">/ {total}</span>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Soldes de Congés</h1><p className="text-gray-500 text-sm mt-1">Consultation et initialisation</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}><HiRefresh className="w-4 h-4" /> Initialiser un solde</button>
      </div>
      <div className="card mb-6">
        <label className="label">Sélectionner un employé</label>
        {loadingInit ? <LoadingSpinner size="sm" /> : (
          <select className="input-field max-w-sm" value={selectedEmployee} onChange={e => { setSelectedEmployee(e.target.value); loadBalances(e.target.value) }}>
            <option value="">-- Choisir un employé --</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
        )}
      </div>
      {loading && <LoadingSpinner size="lg" className="mt-10" />}
      {!loading && selectedEmployee && balances.length === 0 && (
        <div className="card text-center py-16"><HiChartBar className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun solde. Initialisez-en un !</p></div>
      )}
      {!loading && balances.length > 0 && (
        <>
          {yearBalances.length > 0 && (<><h2 className="text-sm font-semibold text-gray-700 mb-3">Année {currentYear}</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">{yearBalances.map(b => <BalanceCard key={b.id} b={b} />)}</div></>)}
          {otherBalances.length > 0 && (<><h2 className="text-sm font-semibold text-gray-700 mb-3">Autres années</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{otherBalances.map(b => <BalanceCard key={b.id} b={b} faded />)}</div></>)}
        </>
      )}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Initialiser un solde">
        <InitForm employees={employees} leaveTypes={leaveTypes} onSubmit={handleInit} onCancel={() => setModal(false)} />
      </Modal>
    </div>
  )
}

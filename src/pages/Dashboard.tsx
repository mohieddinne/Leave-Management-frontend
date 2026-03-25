import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { departmentApi, employeeApi, leaveRequestApi, leaveTypeApi } from '../services/api'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import { StatusBadge } from '../components/shared/Badges'
import type { LeaveRequest } from '../types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Stats {
  departments: number; employees: number; leaveTypes: number
  pending: number; approved: number; rejected: number; total: number
}

function StatCard({ label, value, color, to }: { label: string; value: number; color: string; to: string }) {
  return (
    <Link to={to} className={`card hover:shadow-md transition-shadow border-l-4 ${color}`}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </Link>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      departmentApi.getAll(), employeeApi.getAll(),
      leaveRequestApi.getAll(), leaveTypeApi.getAll(),
    ]).then(([depts, emps, reqs, types]) => {
      const departments = depts.status === 'fulfilled' ? depts.value.data : []
      const employees   = emps.status  === 'fulfilled' ? emps.value.data  : []
      const requests    = reqs.status  === 'fulfilled' ? reqs.value.data  : []
      const leaveTypes  = types.status === 'fulfilled' ? types.value.data : []
      setStats({
        departments: departments.length, employees: employees.length,
        leaveTypes: leaveTypes.length,
        pending:  requests.filter(r => r.status === 'PENDING').length,
        approved: requests.filter(r => r.status === 'APPROVED').length,
        rejected: requests.filter(r => r.status === 'REJECTED').length,
        total: requests.length,
      })
      setRecentRequests(
        [...requests].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()).slice(0, 8)
      )
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-8"><LoadingSpinner size="lg" className="mt-20" /></div>
  if (!stats) return null

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Employés"            value={stats.employees}   color="border-blue-500"   to="/employees" />
        <StatCard label="Départements"        value={stats.departments} color="border-purple-500" to="/departments" />
        <StatCard label="Demandes en attente" value={stats.pending}     color="border-yellow-500" to="/leave-requests" />
        <StatCard label="Types de congés"     value={stats.leaveTypes}  color="border-green-500"  to="/leave-types" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="card text-center"><p className="text-4xl font-bold text-yellow-500 mb-1">{stats.pending}</p><p className="text-sm text-gray-500">En attente</p></div>
        <div className="card text-center"><p className="text-4xl font-bold text-green-500 mb-1">{stats.approved}</p><p className="text-sm text-gray-500">Approuvées</p></div>
        <div className="card text-center"><p className="text-4xl font-bold text-red-500 mb-1">{stats.rejected}</p><p className="text-sm text-gray-500">Rejetées</p></div>
      </div>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Demandes récentes</h2>
          <Link to="/leave-requests" className="text-sm text-blue-600 hover:underline">Voir tout →</Link>
        </div>
        {recentRequests.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune demande pour l'instant.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Employé</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Période</th>
                  <th className="pb-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium">{req.employee?.firstName} {req.employee?.lastName}</td>
                    <td className="py-3 text-gray-600">{req.leaveType?.name ?? '—'}</td>
                    <td className="py-3 text-gray-600">{req.startDate} → {req.endDate}</td>
                    <td className="py-3"><StatusBadge status={req.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

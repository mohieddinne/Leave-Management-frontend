import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { HiHome, HiUserGroup, HiUsers, HiTag, HiClipboardList, HiChartBar, HiCalendar, HiLogout } from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { to: '/',               label: 'Tableau de bord', icon: HiHome,          roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { to: '/departments',    label: 'Départements',     icon: HiUserGroup,     roles: ['ADMIN', 'MANAGER'] },
  { to: '/employees',      label: 'Employés',         icon: HiUsers,         roles: ['ADMIN', 'MANAGER'] },
  { to: '/leave-types',    label: 'Types de Congés',  icon: HiTag,           roles: ['ADMIN'] },
  { to: '/leave-requests', label: 'Demandes',         icon: HiClipboardList, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { to: '/leave-balances', label: 'Soldes',           icon: HiChartBar,      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { to: '/calendar',       label: 'Calendrier',       icon: HiCalendar,      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
]

const roleBadge: Record<UserRole, { label: string; color: string }> = {
  ADMIN:    { label: 'Administrateur', color: 'bg-red-500' },
  MANAGER:  { label: 'Manager',        color: 'bg-green-500' },
  EMPLOYEE: { label: 'Employé',        color: 'bg-orange-400' },
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const visibleNav = navItems.filter(item =>
    user ? item.roles.includes(user.role) : false
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-lg">RH</div>
            <div>
              <p className="font-bold text-sm leading-tight">Gestion des Congés</p>
              <p className="text-blue-300 text-xs">Plateforme RH</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        {user && (
          <div className="p-4 border-t border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded text-white ${roleBadge[user.role].color}`}>
                  {roleBadge[user.role].label}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-blue-200 hover:bg-blue-800 hover:text-white transition-colors"
            >
              <HiLogout className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        )}
        <div className="px-4 pb-3 text-xs text-blue-400">v1.0.0 — Backend: localhost:8080</div>
      </aside>
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  )
}


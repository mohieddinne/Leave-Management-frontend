import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import DepartmentsPage from './pages/DepartmentsPage'
import EmployeesPage from './pages/EmployeesPage'
import LeaveTypesPage from './pages/LeaveTypesPage'
import LeaveRequestsPage from './pages/LeaveRequestsPage'
import LeaveBalancesPage from './pages/LeaveBalancesPage'
import CalendarPage from './pages/CalendarPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />

        {/* ADMIN + MANAGER */}
        <Route path="/departments" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <DepartmentsPage />
          </ProtectedRoute>
        } />
        <Route path="/employees" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <EmployeesPage />
          </ProtectedRoute>
        } />

        {/* ADMIN only */}
        <Route path="/leave-types" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <LeaveTypesPage />
          </ProtectedRoute>
        } />

        {/* All roles */}
        <Route path="/leave-requests" element={<LeaveRequestsPage />} />
        <Route path="/leave-balances" element={<LeaveBalancesPage />} />
        <Route path="/calendar"       element={<CalendarPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}


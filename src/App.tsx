import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
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
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/leave-types" element={<LeaveTypesPage />} />
        <Route path="/leave-requests" element={<LeaveRequestsPage />} />
        <Route path="/leave-balances" element={<LeaveBalancesPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
      </Route>
    </Routes>
  )
}

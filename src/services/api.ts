import axios, { AxiosResponse } from 'axios'
import type {
  Department, DepartmentDto,
  Employee, EmployeeDto,
  LeaveType, LeaveTypeDto,
  LeaveBalance, InitBalanceDto,
  LeaveRequest, LeaveRequestDto,
} from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.message ??
      (typeof err.response?.data === 'string' ? err.response.data : null) ??
      err.message ??
      'Erreur réseau'
    return Promise.reject(new Error(msg))
  }
)

// Departments
export const departmentApi = {
  getAll: (): Promise<AxiosResponse<Department[]>> => api.get('/departments'),
  getById: (id: number): Promise<AxiosResponse<Department>> => api.get(`/departments/${id}`),
  getEmployees: (id: number): Promise<AxiosResponse<Employee[]>> => api.get(`/departments/${id}/employees`),
  create: (data: DepartmentDto): Promise<AxiosResponse<Department>> => api.post('/departments', data),
  update: (id: number, data: DepartmentDto): Promise<AxiosResponse<Department>> => api.put(`/departments/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<void>> => api.delete(`/departments/${id}`),
}

// Employees
export const employeeApi = {
  getAll: (): Promise<AxiosResponse<Employee[]>> => api.get('/employees'),
  getById: (id: number): Promise<AxiosResponse<Employee>> => api.get(`/employees/${id}`),
  create: (data: EmployeeDto): Promise<AxiosResponse<Employee>> => api.post('/employees', data),
  update: (id: number, data: EmployeeDto): Promise<AxiosResponse<Employee>> => api.put(`/employees/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<void>> => api.delete(`/employees/${id}`),
  assignDepartment: (employeeId: number, deptId: number): Promise<AxiosResponse<Employee>> =>
    api.put(`/employees/${employeeId}/department/${deptId}`),
}

// Leave Types
export const leaveTypeApi = {
  getAll: (): Promise<AxiosResponse<LeaveType[]>> => api.get('/leave-types'),
  getActive: (): Promise<AxiosResponse<LeaveType[]>> => api.get('/leave-types/active'),
  getById: (id: number): Promise<AxiosResponse<LeaveType>> => api.get(`/leave-types/${id}`),
  create: (data: LeaveTypeDto): Promise<AxiosResponse<LeaveType>> => api.post('/leave-types', data),
  update: (id: number, data: LeaveTypeDto): Promise<AxiosResponse<LeaveType>> => api.put(`/leave-types/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<void>> => api.delete(`/leave-types/${id}`),
}

// Leave Balances
export const leaveBalanceApi = {
  getByEmployee: (employeeId: number): Promise<AxiosResponse<LeaveBalance[]>> =>
    api.get(`/leave-balances/employee/${employeeId}`),
  getSpecific: (employeeId: number, typeId: number, year: number): Promise<AxiosResponse<LeaveBalance>> =>
    api.get(`/leave-balances/employee/${employeeId}/type/${typeId}/year/${year}`),
  initialize: (data: InitBalanceDto): Promise<AxiosResponse<LeaveBalance>> =>
    api.post('/leave-balances/initialize', data),
}

// Leave Requests
export const leaveRequestApi = {
  getAll: (): Promise<AxiosResponse<LeaveRequest[]>> => api.get('/leave-requests'),
  getById: (id: number): Promise<AxiosResponse<LeaveRequest>> => api.get(`/leave-requests/${id}`),
  getByEmployee: (employeeId: number): Promise<AxiosResponse<LeaveRequest[]>> =>
    api.get(`/leave-requests/employee/${employeeId}`),
  create: (data: LeaveRequestDto): Promise<AxiosResponse<LeaveRequest>> =>
    api.post('/leave-requests', data),
  approve: (id: number, comment: string): Promise<AxiosResponse<LeaveRequest>> =>
    api.put(`/leave-requests/${id}/approve`, { managerComment: comment }),
  reject: (id: number, comment: string): Promise<AxiosResponse<LeaveRequest>> =>
    api.put(`/leave-requests/${id}/reject`, { managerComment: comment }),
  cancel: (id: number): Promise<AxiosResponse<void>> =>
    api.delete(`/leave-requests/${id}`),
}

export default api

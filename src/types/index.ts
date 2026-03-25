// ── Shared Types ─────────────────────────────────────────────
export interface Department {
  id: number
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface Employee {
  id: number
  firstName: string
  lastName: string
  email: string
  jobTitle?: string
  hireDate?: string
  department?: Department
}

export interface LeaveType {
  id: number
  name: string
  description?: string
  paidLeave: boolean
  defaultDaysPerYear: number
  colorCode?: string
  requiresDocumentation: boolean
  canCarryOver: boolean
  maxCarryOverDays: number
  minNoticeDays: number
  allowHalfDay: boolean
  active?: boolean
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface LeaveRequest {
  id: number
  employee: Employee
  leaveType: LeaveType
  startDate: string
  endDate: string
  halfDayStart?: boolean
  halfDayEnd?: boolean
  reason?: string
  isEmergency?: boolean
  contactInfo?: string
  status: LeaveStatus
  numberOfDays?: number
  managerComment?: string
  createdAt?: string
}

export interface LeaveRequestDto {
  employeeId: number
  leaveTypeId: number
  startDate: string
  endDate: string
  halfDayStart?: boolean
  halfDayEnd?: boolean
  reason?: string
  isEmergency?: boolean
  contactInfo?: string
}

export interface LeaveBalance {
  id: number
  employee?: Employee
  leaveType?: LeaveType
  year: number
  totalDays?: number
  allocatedDays?: number
  usedDays?: number
  remainingDays?: number
}

// ── Create / Update DTOs ───────────────────────────────────────────────────────
export interface DepartmentDto {
  name: string
  description?: string
}

export interface EmployeeDto {
  firstName: string
  lastName: string
  email: string
  jobTitle?: string
  hireDate?: string
  department?: { id: number }
}

export interface LeaveTypeDto {
  name: string
  description?: string
  paidLeave: boolean
  defaultDaysPerYear: number
  colorCode?: string
  requiresDocumentation: boolean
  canCarryOver: boolean
  maxCarryOverDays: number
  minNoticeDays: number
  allowHalfDay: boolean
  active?: boolean
}

// (supprimé, doublon corrigé plus haut)

export interface InitBalanceDto {
  employeeId: number
  leaveTypeId: number
  year: number
}

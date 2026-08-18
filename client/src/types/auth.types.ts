import type { IStaff } from './staff.types'

export interface AuthRole {
  code: string
  level: number
  permissions: string[]
  hasSystemAccess: boolean
}

export interface AuthContext extends Omit<IStaff, 'roleId'> {
  role: AuthRole
}

export interface AuthState {
  IStaff: AuthContext | null
  accessToken: string
  authReady: boolean
}

export interface LoginData {
  rut: string
  password: string
}

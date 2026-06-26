import type { User } from './user.types'

export interface AuthState {
  user: User | null
  accessToken: string
  authReady: boolean
}

export interface LoginData {
  rut: string
  password: string
}

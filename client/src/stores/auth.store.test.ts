import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from './auth.store'
import * as AuthService from '../services/auth.service'

// Mockear el servicio, no el store
vi.mock('../services/auth.service', () => ({
  login: vi.fn(),
  getUser: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn()
}))

// Mockear useApiPrivate
// Como es interno del store, puede ser tricky.
// Vamos a confiar en que useApiPrivate use la instancia mockeada del servicio si lo pasamos?
// En el store: AuthService.getUser(apiPrivate)
// Si AuthService.getUser está mockeado, no importa qué sea apiPrivate.
vi.mock('../composables/useApi', () => ({
  useApiPrivate: vi.fn(() => ({})) // Dummy axios instance
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('login should update state and fetch IStaff', async () => {
    const store = useAuthStore()

    // Mocks responses
    const mockTokenResp = { access_token: 'fake-token' }
    const mockUserResp = { id: 1, nombre: 'Test', apellido: 'IStaff' }

    vi.mocked(AuthService.login).mockResolvedValue(mockTokenResp as any)
    vi.mocked(AuthService.getUser).mockResolvedValue(mockUserResp as any)

    // Execute action
    await store.login({ rut: '123', password: 'password' })

    // Assertions
    expect(store.accessToken).toBe('fake-token')
    expect(store.isAuthenticated).toBe(true)
    expect(store.IStaff).toEqual(mockUserResp)
    expect(store.authReady).toBe(true)

    expect(AuthService.login).toHaveBeenCalledTimes(1)
    expect(AuthService.getUser).toHaveBeenCalledTimes(1)
  })

  it('logout should clear state', async () => {
    const store = useAuthStore()
    store.accessToken = 'some-token'
    store.IStaff = { id: 1 } as any

    vi.mocked(AuthService.logout).mockResolvedValue({} as any)

    await store.logout()

    expect(store.accessToken).toBe('')
    expect(store.IStaff).toBeNull()
  })
})

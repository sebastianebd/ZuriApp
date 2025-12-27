import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as AuthService from './auth.service'
import { errorHandler } from '../utils/errorHandler'

// Mocks
const mockApi = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn()
}))

vi.mock('../composables/useApi', () => ({
  useApi: () => mockApi,
  useApiPrivate: () => mockApi
}))

vi.mock('../utils/errorHandler', () => ({
  errorHandler: vi.fn((err) => err)
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('login should call API and return data', async () => {
    const payload = { rut: '123', password: 'pass' }
    const mockResponse = { data: { token: 'abc' } }
    mockApi.post.mockResolvedValue(mockResponse)

    const result = await AuthService.login(payload)

    expect(mockApi.post).toHaveBeenCalledWith('/auth/login', payload)
    expect(result).toEqual(mockResponse.data)
  })

  it('login should handle errors', async () => {
    const error = new Error('Network Error')
    mockApi.post.mockRejectedValue(error)

    await expect(AuthService.login({ rut: '1', password: '2' })).rejects.toThrow()
    expect(errorHandler).toHaveBeenCalledWith(error)
  })

  it('refresh should call API and return data', async () => {
    const mockResponse = { data: { access_token: 'new' } }
    mockApi.post.mockResolvedValue(mockResponse)

    const result = await AuthService.refresh()

    expect(mockApi.post).toHaveBeenCalledWith('/auth/refresh')
    expect(result).toEqual(mockResponse.data)
  })

  it('logout should use private API', async () => {
    const mockResponse = { data: { success: true } }
    mockApi.post.mockResolvedValue(mockResponse)

    const result = await AuthService.logout(mockApi as any)

    expect(mockApi.post).toHaveBeenCalledWith('/auth/logout')
    expect(result).toEqual(mockResponse.data)
  })

  it('getUser should use private API', async () => {
    const mockResponse = { data: { name: 'User' } }
    mockApi.get.mockResolvedValue(mockResponse)

    const result = await AuthService.getUser(mockApi as any)

    expect(mockApi.get).toHaveBeenCalledWith('/auth/user')
    expect(result).toEqual(mockResponse.data)
  })
})

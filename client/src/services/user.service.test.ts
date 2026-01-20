import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as UserService from './user.service'
import { errorHandler } from '../utils/errorHandler'

// Mocks
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}

vi.mock('../utils/errorHandler', () => ({
  errorHandler: vi.fn((err) => err)
}))

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('crearUsuario should POST to /users/', async () => {
    const payload = { rut: '1', nombre: 'Test' } as any
    const mockResponse = { data: { id: 'new' } }
    mockApi.post.mockResolvedValue(mockResponse)

    const result = await UserService.crearUsuario(mockApi as any, payload)

    expect(mockApi.post).toHaveBeenCalledWith('/users/', payload)
    expect(result).toEqual(mockResponse.data)
  })

  it('actualizarUsuario should PUT to /users/:id', async () => {
    const id = '123'
    const payload = { nombre: 'Updated' } as any
    const mockResponse = { data: { success: true } }
    mockApi.put.mockResolvedValue(mockResponse)

    const result = await UserService.actualizarUsuario(mockApi as any, id, payload)

    expect(mockApi.put).toHaveBeenCalledWith(`/users/${id}`, payload)
    expect(result).toEqual(mockResponse.data)
  })

  it('eliminarUsuario should DELETE /users/:id', async () => {
    const id = '123'
    const mockResponse = { data: { success: true } }
    mockApi.delete.mockResolvedValue(mockResponse)

    const result = await UserService.eliminarUsuario(mockApi as any, id)

    expect(mockApi.delete).toHaveBeenCalledWith(`/users/${id}`)
    expect(result).toEqual(mockResponse.data)
  })

  it('mostrarUsersCargoTens should GET /users/tens', async () => {
    const mockResponse = { data: ['tens1', 'tens2'] }
    mockApi.get.mockResolvedValue(mockResponse)

    const result = await UserService.mostrarUsersCargoTens(mockApi as any)

    expect(mockApi.get).toHaveBeenCalledWith('/users/tens')
    expect(result).toEqual(mockResponse.data)
  })

  it('mostrarTodosUsuarios should GET /users/', async () => {
    const mockResponse = { data: ['user1', 'user2'] }
    mockApi.get.mockResolvedValue(mockResponse)

    const result = await UserService.mostrarTodosUsuarios(mockApi as any)

    expect(mockApi.get).toHaveBeenCalledWith('/users/', { params: { search: undefined } })
    expect(result).toEqual(mockResponse.data)
  })

  it('should handle errors using errorHandler', async () => {
    const error = new Error('API Error')
    mockApi.get.mockRejectedValue(error)

    await expect(UserService.mostrarTodosUsuarios(mockApi as any)).rejects.toThrow()
    expect(errorHandler).toHaveBeenCalledWith(error)
  })
})

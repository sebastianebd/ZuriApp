import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as UserService from './staff.service'
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

  it('createStaff should POST to /staff', async () => {
    const payload = { rut: '1', firstName: 'Test' } as any
    const mockResponse = { data: { id: 'new' } }
    mockApi.post.mockResolvedValue(mockResponse)

    const result = await UserService.createStaff(mockApi as any, payload as any)

    expect(mockApi.post).toHaveBeenCalledWith('/staff', payload)
    expect(result).toEqual(mockResponse.data)
  })

  it('updateStaff should PUT to /staff/:id', async () => {
    const id = '123'
    const payload = { firstName: 'Updated' }
    const mockResponse = { data: { id, ...payload } }
    mockApi.put.mockResolvedValue(mockResponse)

    const result = await UserService.updateStaff(mockApi as any, id, payload)

    expect(mockApi.put).toHaveBeenCalledWith(`/staff/${id}`, payload)
    expect(result).toEqual(mockResponse.data)
  })

  it('deleteStaff should DELETE /staff/:id', async () => {
    const id = '123'
    const mockResponse = { data: { success: true } }
    mockApi.delete.mockResolvedValue(mockResponse)

    const result = await UserService.deleteStaff(mockApi as any, id)

    expect(mockApi.delete).toHaveBeenCalledWith(`/staff/${id}`)
    expect(result).toEqual(mockResponse.data)
  })



  it('getAllStaff should GET /staff', async () => {
    const mockResponse = { data: ['user1', 'user2'] }
    mockApi.get.mockResolvedValue(mockResponse)

    const result = await UserService.getAllStaff(mockApi as any)

    expect(mockApi.get).toHaveBeenCalledWith('/staff', { params: undefined })
    expect(result).toEqual(mockResponse.data)
  })

  it('should handle errors using errorHandler', async () => {
    const error = new Error('API Error')
    mockApi.get.mockRejectedValue(error)

    await expect(UserService.getAllStaff(mockApi as any)).rejects.toThrow()
    expect(errorHandler).toHaveBeenCalledWith(error)
  })
})

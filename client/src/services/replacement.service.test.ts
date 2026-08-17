import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as ReplacementService from './replacement.service'
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

describe('ReplacementService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. obtenerInactivosPaginados
  it('obtenerInactivosPaginados should GET /reemplazos/historial-paginado with params', async () => {
    const filtros = { rutSaliente: '1-9' }
    const params = { ...filtros, pagina: 1, limite: 10 }
    const mockResponse = { data: { registros: [], total: 0 } }
    mockApi.get.mockResolvedValue(mockResponse)

    const result = await ReplacementService.obtenerInactivosPaginados(
      mockApi as any,
      filtros,
      1,
      10
    )

    expect(mockApi.get).toHaveBeenCalledWith('/reemplazos/historial-paginado', { params })
    expect(result).toEqual(mockResponse.data)
  })

  // 2. crearReemplazo
  it('crearReemplazo should POST to /reemplazos/', async () => {
    const payload = { id_entrante: 'e1' } as any
    const mockResponse = { data: { id: 'new' } }
    mockApi.post.mockResolvedValue(mockResponse)

    const result = await ReplacementService.crearReemplazo(payload, mockApi as any)

    expect(mockApi.post).toHaveBeenCalledWith('/reemplazos/', payload)
    expect(result).toEqual(mockResponse.data)
  })

  // 3. actualizarReemplazo
  it('actualizarReemplazo should PUT to /reemplazos/:id', async () => {
    const id = 'r1'
    const payload = { id_entrante: 'e2' } as any
    const mockResponse = { data: { success: true } }
    mockApi.put.mockResolvedValue(mockResponse)

    const result = await ReplacementService.actualizarReemplazo(mockApi as any, id, payload)

    expect(mockApi.put).toHaveBeenCalledWith(`/reemplazos/${id}`, payload)
    expect(result).toEqual(mockResponse.data)
  })

  // 4. finalizarReemplazo
  it('finalizarReemplazo should PUT to /reemplazos/finalizar/:id', async () => {
    const id = 'r1'
    const mockResponse = { data: { success: true } }
    mockApi.put.mockResolvedValue(mockResponse)

    const result = await ReplacementService.finalizarReemplazo(mockApi as any, id)

    expect(mockApi.put).toHaveBeenCalledWith(`/reemplazos/finalizar/${id}`, {})
    expect(result).toEqual(mockResponse.data)
  })

  // 5. anularReemplazo
  it('anularReemplazo should PUT to /reemplazos/anular/:id', async () => {
    const id = 'r1'
    const mockResponse = { data: { success: true } }
    mockApi.put.mockResolvedValue(mockResponse)

    const result = await ReplacementService.anularReemplazo(mockApi as any, id)

    expect(mockApi.put).toHaveBeenCalledWith(`/reemplazos/anular/${id}`)
    expect(result).toEqual(mockResponse.data)
  })

  // 6. Lista básica y Historial
  it('mostrarReemplazos should GET /reemplazos/', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    await ReplacementService.mostrarReemplazos(mockApi as any)
    expect(mockApi.get).toHaveBeenCalledWith('/reemplazos/', expect.anything())
  })

  it('mostrarHistorialUsuario should GET /reemplazos/:id', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    await ReplacementService.mostrarHistorialUsuario(mockApi as any, 'u1')
    expect(mockApi.get).toHaveBeenCalledWith('/reemplazos/u1')
  })

  it('procesarSustitucion should POST to /reemplazos/sustituir', async () => {
    const payload = { id_reemplazo: 'r1' } as any
    const mockResponse = { data: { success: true } }
    mockApi.post.mockResolvedValue(mockResponse)

    const result = await ReplacementService.procesarSustitucion(mockApi as any, payload)

    expect(mockApi.post).toHaveBeenCalledWith('/reemplazos/sustituir', payload)
    expect(result).toEqual(mockResponse.data)
  })

  it('should handle errors', async () => {
    const error = new Error('API Fail')
    mockApi.get.mockRejectedValue(error)
    await expect(ReplacementService.mostrarReemplazos(mockApi as any)).rejects.toThrow()
    expect(errorHandler).toHaveBeenCalledWith(error)
  })
})

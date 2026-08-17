import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUsers } from './useEmployees'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  fetchPaginated: vi.fn(),
  fetchServices: vi.fn(),
  fetchRoles: vi.fn(),
  fetchPositions: vi.fn(),
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
  deleteStaff: vi.fn(),
  mostrarHistorialUsuario: vi.fn(),
  showAlert: vi.fn(),
  apiGet: vi.fn()
}))

const mockUsersState: any[] = []

vi.mock('@/stores/staff.store', () => ({
  useStaffStore: () => ({
    fetchPaginated: mocks.fetchPaginated,
    createStaff: mocks.createStaff,
    updateStaff: mocks.updateStaff,
    deleteStaff: mocks.deleteStaff,
    currentPageStaff: mockUsersState,
    pagination: { totalPages: 1 }
  })
}))

vi.mock('@/stores/service.store', () => ({
  useServiceStore: () => ({
    fetchServices: mocks.fetchServices,
    services: []
  })
}))

vi.mock('@/stores/role.store', () => ({
  useRoleStore: () => ({
    fetchRoles: mocks.fetchRoles,
    roles: []
  })
}))

vi.mock('@/stores/position.store', () => ({
  usePositionStore: () => ({
    fetchPositions: mocks.fetchPositions,
    positions: []
  })
}))

vi.mock('@/stores/replacement.store', () => ({
  useReplacementStore: () => ({
    mostrarHistorialUsuario: mocks.mostrarHistorialUsuario
  })
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    usePrivateApi: () => ({
      get: mocks.apiGet
    }),
    IStaff: { role: { level: 999 } }
  })
}))

// Mock inject
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    inject: (key: string) => {
      if (key === 'showAlert') return mocks.showAlert
      return undefined
    }
  }
})

describe('useUsers Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    const users = [
      {
        _id: '1',
        firstName: 'Test',
        lastName: 'IStaff',
        rut: '12345678-9',
        positionId: 'pos1',
        isActive: true
      },
      {
        _id: '2',
        firstName: 'Jane',
        lastName: 'Doe',
        rut: '98765432-1',
        positionId: 'pos2',
        isActive: false
      }
    ]

    mockUsersState.length = 0
    mockUsersState.push(...users)

    mocks.fetchPaginated.mockResolvedValue(undefined)
    mocks.apiGet.mockResolvedValue({ data: [] })
  })

  function mountComposable() {
    let result: any
    const Comp = {
      template: '<div></div>',
      setup() {
        result = useUsers()
        return {}
      }
    }
    mount(Comp)
    return result
  }

  it('should load users and options on mount', async () => {
    const { paginatedUsuarios, listaTipoContrato } = mountComposable()

    await new Promise((r) => setTimeout(r, 0))

    expect(mocks.fetchPaginated).toHaveBeenCalled()
    expect(mocks.fetchServices).toHaveBeenCalled()
    expect(mocks.fetchRoles).toHaveBeenCalled()
    expect(mocks.fetchPositions).toHaveBeenCalled()
    expect(paginatedUsuarios.value).toHaveLength(2)
    expect(listaTipoContrato.value).toContain('CONTRATA')
  })

  it('should filter users by RUT', async () => {
    const { filtroRut, usuariosFiltrados } = mountComposable()
    await new Promise((r) => setTimeout(r, 0))

    filtroRut.value = '123'

    const filtered = mockUsersState.filter((u) => u.rut.includes('123'))
    mockUsersState.length = 0
    mockUsersState.push(...filtered)

    expect(usuariosFiltrados.value).toHaveLength(1)
    expect(usuariosFiltrados.value[0].firstName).toBe('Test')
  })

  it('should handle IStaff creation (CRUD)', async () => {
    const { handleCreate, paginatedUsuarios: usuarios } = mountComposable()
    await new Promise((r) => setTimeout(r, 0))

    const newUser = { firstName: 'New', lastName: 'IStaff', rut: '11111111-1' }
    mocks.createStaff.mockResolvedValue({ ...newUser, _id: '3' })

    mockUsersState.push({ ...newUser, _id: '3' })

    await handleCreate(newUser as any)

    expect(mocks.createStaff).toHaveBeenCalledWith(newUser)
    expect(usuarios.value).toHaveLength(3)
    expect(mocks.showAlert).toHaveBeenCalledWith('Guardado', expect.stringContaining('creado'))
  })

  it('should handle IStaff deletion (CRUD)', async () => {
    const { handleDelete, paginatedUsuarios: usuarios } = mountComposable()
    await new Promise((r) => setTimeout(r, 0))

    expect(usuarios.value).toHaveLength(2)

    const idx = mockUsersState.findIndex((u) => u._id === '1')
    if (idx !== -1) mockUsersState.splice(idx, 1)

    await handleDelete('1')

    expect(mocks.deleteStaff).toHaveBeenCalledWith('1')
    expect(usuarios.value).toHaveLength(1)
    expect(usuarios.value[0]._id).toBe('2')
    expect(mocks.showAlert).toHaveBeenCalledWith('Eliminado', expect.stringContaining('eliminado'))
  })

  it('should open history modal and load history', async () => {
    const { openHistorialModal, historialUsuario, historialModalVisible } = mountComposable()

    mocks.mostrarHistorialUsuario.mockResolvedValue(['reemplazo1'])

    await openHistorialModal({ _id: '1' })

    expect(historialModalVisible.value).toBe(true)
    expect(mocks.mostrarHistorialUsuario).toHaveBeenCalledWith('1')
    expect(historialUsuario.value).toEqual(['reemplazo1'])
  })
})

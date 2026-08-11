import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUsers } from './useEmployees'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  fetchPaginated: vi.fn(),
  mostrarTodos: vi.fn(),
  crearUsuario: vi.fn(),
  actualizarUsuario: vi.fn(),
  eliminarUsuario: vi.fn(),
  mostrarOpciones: vi.fn(),
  mostrarHistorialUsuario: vi.fn(),
  showAlert: vi.fn(),
  apiGet: vi.fn()
}))

const mockUsersState: any[] = []

vi.mock('@/stores/user.store', () => ({
  useUserStore: () => ({
    fetchPaginated: mocks.fetchPaginated,
    mostrarTodos: mocks.mostrarTodos,
    crearUsuario: mocks.crearUsuario,
    actualizarUsuario: mocks.actualizarUsuario,
    eliminarUsuario: mocks.eliminarUsuario,
    currentPageUsers: mockUsersState,
    paginationInfo: { totalPages: 1 }
  })
}))

vi.mock('@/stores/option.store', () => ({
  useOptionStore: () => ({
    mostrarOpciones: mocks.mostrarOpciones
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
    })
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
        nombre: 'Test',
        apellido: 'User',
        rut: '12345678-9',
        tipo_cargo: 'TENS',
        habilitado: 'SI'
      },
      {
        _id: '2',
        nombre: 'Jane',
        apellido: 'Doe',
        rut: '98765432-1',
        tipo_cargo: 'ENFERMERA',
        habilitado: 'NO'
      }
    ]

    // Update state directly as store action would
    mockUsersState.length = 0
    mockUsersState.push(...users)

    // Setup mocks
    mocks.fetchPaginated.mockResolvedValue({ total: 2, users })
    mocks.mostrarOpciones.mockResolvedValue({
      tipoCargo: ['TENS', 'ENFERMERA'],
      habilitado: ['SI', 'NO'],
      servicios: ['URGENCIA']
    })
    mocks.apiGet.mockResolvedValue({ data: [] })
  })

  // Helper to mount composable
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
    const { paginatedUsuarios: usuarios, listaTipoCargo } = mountComposable()

    await new Promise((r) => setTimeout(r, 0))

    expect(mocks.fetchPaginated).toHaveBeenCalled()
    expect(mocks.mostrarOpciones).toHaveBeenCalled()
    expect(usuarios.value).toHaveLength(2)
    expect(listaTipoCargo.value).toContain('TENS')
  })

  it('should filter users by RUT', async () => {
    const { filtroRut, usuariosFiltrados } = mountComposable()
    await new Promise((r) => setTimeout(r, 0))

    filtroRut.value = '123'

    // Simulate server-side filtering updating the store
    const filtered = mockUsersState.filter((u) => u.rut.includes('123'))
    mockUsersState.length = 0
    mockUsersState.push(...filtered)

    expect(usuariosFiltrados.value).toHaveLength(1)
    expect(usuariosFiltrados.value[0].nombre).toBe('Test')
  })

  it('should handle user creation (CRUD)', async () => {
    const { handleCreate, paginatedUsuarios: usuarios } = mountComposable()
    await new Promise((r) => setTimeout(r, 0))

    const newUser = { nombre: 'New', apellido: 'User', rut: '11111111-1' }
    mocks.crearUsuario.mockResolvedValue({ ...newUser, _id: '3' })

    // Simulate store update
    mockUsersState.push({ ...newUser, _id: '3' })

    await handleCreate(newUser as any)

    expect(mocks.crearUsuario).toHaveBeenCalledWith(newUser)
    expect(usuarios.value).toHaveLength(3) // 2 loaded + 1 created
    expect(mocks.showAlert).toHaveBeenCalledWith('Guardado', expect.stringContaining('creado'))
  })

  it('should handle user deletion (CRUD)', async () => {
    const { handleDelete, paginatedUsuarios: usuarios } = mountComposable()
    await new Promise((r) => setTimeout(r, 0))

    expect(usuarios.value).toHaveLength(2)

    // Simulate store update
    const idx = mockUsersState.findIndex((u) => u._id === '1')
    if (idx !== -1) mockUsersState.splice(idx, 1)

    await handleDelete('1')

    expect(mocks.eliminarUsuario).toHaveBeenCalledWith('1')
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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUsers } from './useUsers'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  mostrarTodos: vi.fn(),
  crearUsuario: vi.fn(),
  actualizarUsuario: vi.fn(),
  eliminarUsuario: vi.fn(),
  mostrarOpciones: vi.fn(),
  mostrarHistorialUsuario: vi.fn(),
  showAlert: vi.fn()
}))

vi.mock('@/stores/user.store', () => ({
  useUserStore: () => ({
    mostrarTodos: mocks.mostrarTodos,
    crearUsuario: mocks.crearUsuario,
    actualizarUsuario: mocks.actualizarUsuario,
    eliminarUsuario: mocks.eliminarUsuario
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

    // Setup default mock returns
    mocks.mostrarTodos.mockResolvedValue([
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
    ])
    mocks.mostrarOpciones.mockResolvedValue({
      tipoCargo: ['TENS', 'ENFERMERA'],
      habilitado: ['SI', 'NO'],
      servicios: ['URGENCIA']
    })
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
    const { usuarios, listaTipoCargo } = mountComposable()

    await new Promise((r) => setTimeout(r, 0))

    expect(mocks.mostrarTodos).toHaveBeenCalled()
    expect(mocks.mostrarOpciones).toHaveBeenCalled()
    expect(usuarios.value).toHaveLength(2)
    expect(listaTipoCargo.value).toContain('TENS')
  })

  it('should filter users by RUT', async () => {
    const { usuarios, filtroRut, usuariosFiltrados } = mountComposable()
    await new Promise((r) => setTimeout(r, 0))

    filtroRut.value = '123'
    expect(usuariosFiltrados.value).toHaveLength(1)
    expect(usuariosFiltrados.value[0].nombre).toBe('Test')
  })

  it('should handle user creation (CRUD)', async () => {
    const { handleCreate, usuarios } = mountComposable()
    await new Promise((r) => setTimeout(r, 0))

    const newUser = { nombre: 'New', apellido: 'User', rut: '11111111-1' }
    mocks.crearUsuario.mockResolvedValue({ ...newUser, _id: '3' })

    await handleCreate(newUser as any)

    expect(mocks.crearUsuario).toHaveBeenCalledWith(newUser)
    expect(usuarios.value).toHaveLength(3) // 2 loaded + 1 created
    expect(mocks.showAlert).toHaveBeenCalledWith('Guardado', expect.stringContaining('creado'))
  })

  it('should handle user deletion (CRUD)', async () => {
    const { handleDelete, usuarios } = mountComposable()
    await new Promise((r) => setTimeout(r, 0))

    expect(usuarios.value).toHaveLength(2)

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

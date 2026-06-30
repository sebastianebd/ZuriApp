import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useReplacements } from './useActiveReplacements'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'

// Mocks
const mockShowAlert = vi.fn()
const mockReplacementStore = {
  reemplazosFiltrados: [],
  paginationInfo: { totalPages: 1 },
  hayReemplazos: false,
  mostrarReemplazos: vi.fn(),
  fetchActiveReplacementsPaginated: vi.fn(),
  procesarSustitucion: vi.fn(),
  crearReemplazo: vi.fn(),
  finalizarReemplazo: vi.fn(),
  actualizarReemplazo: vi.fn(),
  anularReemplazo: vi.fn(),
  getFechasOcupadas: vi.fn(() => [])
}
const mockAuthStore = {
  userDetail: { _id: 'admin-id' },
  usePrivateApi: vi.fn()
}
const mockOptionStore = {
  mostrarOpciones: vi.fn().mockResolvedValue({
    tiposTurno: ['MAÑANA'],
    servicios: ['URGENCIA'],
    tipoCargo: ['ENFERMERA']
  })
}

// Mock Dependencies
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => mockAuthStore
}))
vi.mock('@/stores/option.store', () => ({
  useOptionStore: () => mockOptionStore
}))
vi.mock('@/stores/replacement.store', () => ({
  useReplacementStore: () => mockReplacementStore
}))
vi.mock('@/services/user.service', () => ({
  mostrarTodosUsuarios: vi.fn().mockResolvedValue([{ _id: 'u1', nombre: 'Test' }])
}))
vi.mock('@/plugins/socket', () => ({
  default: {
    on: vi.fn(),
    off: vi.fn()
  }
}))
vi.mock('vue', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    inject: (key: string) => {
      if (key === 'showAlert') return mockShowAlert
      return undefined
    }
  }
})

vi.mock('@/stores/turn-type.store', () => ({
  useTurnTypeStore: () => ({
    fetchTurnTypes: vi.fn(),
    turnTypes: [{ nombre: 'MAÑANA' }]
  })
}))

// Mock Modal Logic
const mockModalLogic = {
  createModalVisible: ref(false),
  updateModalVisible: ref(false),
  substituteModalVisible: ref(false),
  registroNuevo: ref({}),
  registroActual: ref({}),
  grupo: ref(1),
  cargoDeFiltrado: ref(''),
  nuevoEntranteSustitucion: ref({}),

  openUserModal: vi.fn(),
  handleSustitucion: vi.fn(),
  createSustitucionPayload: vi.fn(() => ({ id: 'payload' })),
  closeSubstituteModal: vi.fn(),
  closeUserModal: vi.fn(),
  assignUserData: vi.fn(),
  openUpdateModal: vi.fn(),
  openCreateModal: vi.fn(),
  closeCreateModal: vi.fn(),
  closeUpdateModal: vi.fn()
}

vi.mock('@/composables/active-replacements/useReplacementModals', () => ({
  useReplacementModals: () => mockModalLogic
}))

function withSetup<T>(composable: () => T) {
  let result: T
  const wrapper = mount({
    setup() {
      result = composable()
      return () => {}
    }
  })
  return { result: result!, wrapper }
}

describe('useReplacements', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockReplacementStore.hayReemplazos = false
  })

  it('loads data on mount', async () => {
    const { result } = withSetup(() => useReplacements())
    const { listaDeTurnos } = result

    await new Promise((r) => setTimeout(r, 0))

    expect(mockReplacementStore.fetchActiveReplacementsPaginated).toHaveBeenCalled()
    expect(mockOptionStore.mostrarOpciones).toHaveBeenCalled()
    expect(listaDeTurnos.value).toEqual(['MAÑANA'])
  })

  it('confirms substitution with valid data', async () => {
    const { result } = withSetup(() => useReplacements())
    const { confirmarSustitucion } = result

    mockModalLogic.nuevoEntranteSustitucion.value = { rut_entrante: '123' }

    await confirmarSustitucion()

    expect(mockModalLogic.createSustitucionPayload).toHaveBeenCalled()
    expect(mockReplacementStore.procesarSustitucion).toHaveBeenCalledWith({ id: 'payload' })
    expect(mockModalLogic.closeSubstituteModal).toHaveBeenCalled()
    expect(mockShowAlert).toHaveBeenCalledWith(
      expect.stringContaining('Sustitución Exitosa'),
      expect.any(String)
    )
  })

  it('shows error if confirming substitution without entrant', async () => {
    mockModalLogic.nuevoEntranteSustitucion.value = { rut_entrante: '' }
    const { result } = withSetup(() => useReplacements())
    const { confirmarSustitucion } = result

    await confirmarSustitucion()

    expect(mockShowAlert).toHaveBeenCalledWith('Error', expect.stringContaining('Debe asignar'))
    expect(mockReplacementStore.procesarSustitucion).not.toHaveBeenCalled()
  })

  it('saves new replacement', async () => {
    const { result } = withSetup(() => useReplacements())
    const { guardarNuevoReemplazo } = result
    const data = { id: 'new' } as any

    await guardarNuevoReemplazo(data)

    expect(mockReplacementStore.crearReemplazo).toHaveBeenCalledWith(data)
    expect(mockModalLogic.closeCreateModal).toHaveBeenCalled()
    expect(mockShowAlert).toHaveBeenCalledWith('Guardado', expect.any(String))
  })

  it('handles update replacement', async () => {
    const { result } = withSetup(() => useReplacements())
    const { handleUpdate } = result
    mockModalLogic.registroActual.value = { _id: 'r1', data: 'update' }

    await handleUpdate()

    expect(mockReplacementStore.actualizarReemplazo).toHaveBeenCalledWith('r1', {
      _id: 'r1',
      data: 'update'
    })
    expect(mockModalLogic.closeUpdateModal).toHaveBeenCalled()
    expect(mockShowAlert).toHaveBeenCalledWith('Modificado', expect.any(String))
  })

  it('handles finalize replacement', async () => {
    const { result } = withSetup(() => useReplacements())
    const { handleFinalizar } = result
    await handleFinalizar('r1')
    expect(mockReplacementStore.finalizarReemplazo).toHaveBeenCalledWith('r1')
    expect(mockShowAlert).toHaveBeenCalledWith('Finalizado', expect.any(String))
  })

  it('handles annul replacement', async () => {
    const { result } = withSetup(() => useReplacements())
    const { handleAnular } = result
    await handleAnular('r1')
    expect(mockReplacementStore.anularReemplazo).toHaveBeenCalledWith('r1')
    expect(mockShowAlert).toHaveBeenCalledWith('Anulado', expect.any(String))
  })
})

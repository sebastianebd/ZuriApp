import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useUserStore } from '@/stores/user.store'
import { useOptionStore } from '@/stores/option.store'
import { useAuthStore } from '@/stores/auth.store'
import { useReplacementStore } from '@/stores/replacement.store'
import type { User } from '@/types/models'
import socket from '@/plugins/socket'

export function useUsers() {
  const showAlert = inject<(title: string, message: string) => void>('showAlert')

  // --- STORES
  const userStore = useUserStore()
  const optionStore = useOptionStore()
  const authStore = useAuthStore()
  const replacementStore = useReplacementStore()

  // --- REFS
  const usuarios = ref<any[]>([])

  // Filters
  const filtroRut = ref('')
  const filtroNombre = ref('')
  const tipoCargo = ref('')
  const filtroHabilitado = ref('')

  // Lists
  const listaTipoCargo = ref<string[]>([])
  const listaHabilitado = ref<string[]>([])
  const listaServicios = ref<string[]>([])

  // Modal Visibility
  const updateModalVisible = ref(false)
  const createModalVisible = ref(false)
  const historialModalVisible = ref(false)

  // Selection
  const usuarioSeleccionado = ref<any>(null)
  const usuarioActual = ref<any>({})
  const historialUsuario = ref<any[]>([])

  // --- PAGINACIÓN
  const currentPage = ref(1)
  const itemsPerPage = 10

  const userLoged = computed(() => {
    return authStore.user
  })

  // --- FILTER & SORT LOGIC
  const usuariosFiltrados = computed(() => {
    const filtrados = usuarios.value.filter((u) => {
      const coincideRut = !filtroRut.value || u.rut.startsWith(filtroRut.value)
      const coincideCargo = !tipoCargo.value || u.tipo_cargo === tipoCargo.value
      const coincideHabilitado = !filtroHabilitado.value || u.habilitado === filtroHabilitado.value
      const nombreCompleto = ((u.nombre || '') + ' ' + (u.apellido || '')).toLowerCase()
      const busquedaNombre = (filtroNombre.value || '').toLowerCase()
      const coincideNombre = !busquedaNombre || nombreCompleto.includes(busquedaNombre)
      return coincideRut && coincideCargo && coincideHabilitado && coincideNombre
    })
    return filtrados.sort((a, b) => {
      const nombreA = (a.nombre || '').toLowerCase()
      const nombreB = (b.nombre || '').toLowerCase()
      return nombreA.localeCompare(nombreB)
    })
  })

  const totalPages = computed(() => {
    return Math.ceil(usuariosFiltrados.value.length / itemsPerPage)
  })

  const paginatedUsuarios = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return usuariosFiltrados.value.slice(start, end)
  })

  function changePage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  // --- MODAL ACTIONS
  async function openHistorialModal(usuario: any) {
    usuarioSeleccionado.value = usuario
    historialModalVisible.value = true
    try {
      historialUsuario.value = await replacementStore.mostrarHistorialUsuario(usuario._id)
    } catch (error) {
      console.error('Error cargando historial:', error)
      showAlert?.('Error', 'No se pudo cargar el historial del usuario.')
    }
  }

  function closeHistorialModal() {
    historialModalVisible.value = false
    usuarioSeleccionado.value = null
    historialUsuario.value = []
  }

  function openUpdateModal(usuario: User) {
    usuarioActual.value = { ...usuario }
    updateModalVisible.value = true
  }

  function closeUpdateModal() {
    updateModalVisible.value = false
    usuarioActual.value = {}
  }

  function openCreateModal() {
    createModalVisible.value = true
  }

  function closeCreateModal() {
    createModalVisible.value = false
  }

  // --- CRUD HANDLERS
  async function handleUpdate(usuario: User) {
    await userStore.actualizarUsuario(usuario._id, usuario)
    usuarios.value = await userStore.mostrarTodos()
    closeUpdateModal()
    showAlert?.('Modificado', 'El registro se ha modificado correctamente.')
  }

  async function handleDelete(id: string) {
    await userStore.eliminarUsuario(id)
    usuarios.value = usuarios.value.filter((u) => u._id !== id)
    showAlert?.('Eliminado', 'El usuario se ha eliminado correctamente.')
  }

  async function handleCreate(nuevoUsuario: User) {
    const usuarioCreado = await userStore.crearUsuario(nuevoUsuario)
    usuarios.value.push(usuarioCreado)
    closeCreateModal()
    showAlert?.('Guardado', 'El usuario se ha creado correctamente.')
  }

  async function loadUsers() {
    usuarios.value = await userStore.mostrarTodos()
    const opciones = await optionStore.mostrarOpciones()
    listaTipoCargo.value = opciones.tipoCargo
    listaHabilitado.value = opciones.habilitado
    listaServicios.value = opciones.servicios
  }

  onMounted(async () => {
    await loadUsers()

    socket.on('users:update', async () => {
      await loadUsers()
    })
  })

  onUnmounted(() => {
    socket.off('users:update')
  })

  return {
    // State
    usuarios,
    usuariosFiltrados,
    paginatedUsuarios,
    userLoged,

    // Filters
    filtroRut,
    filtroNombre,
    tipoCargo,
    filtroHabilitado,

    // Lists
    listaTipoCargo,
    listaHabilitado,
    listaServicios,

    // Pagination
    currentPage,
    totalPages,
    changePage,

    // Modals Visibility
    updateModalVisible,
    createModalVisible,
    historialModalVisible,

    // Selected Data
    usuarioActual,
    usuarioSeleccionado,
    historialUsuario,

    // Actions
    openHistorialModal,
    closeHistorialModal,
    openUpdateModal,
    closeUpdateModal,
    openCreateModal,
    closeCreateModal,

    // CRUD
    handleUpdate,
    handleDelete,
    handleCreate,
    loadUsers
  }
}

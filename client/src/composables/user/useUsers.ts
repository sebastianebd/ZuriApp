import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { debounce } from 'lodash-es'
import { useUserStore } from '@/stores/user.store'
import { useOptionStore } from '@/stores/option.store'
import { useAuthStore } from '@/stores/auth.store'
import { useReplacementStore } from '@/stores/replacement.store'
import type { User } from '@/types/models'
import socket from '@/plugins/socket'

export function useUsers() {
  const showAlert =
    inject<(title: string, message: string, type?: 'success' | 'error' | 'info') => void>(
      'showAlert'
    )

  // --- STORES
  const userStore = useUserStore()
  const optionStore = useOptionStore()
  const authStore = useAuthStore()
  const replacementStore = useReplacementStore()

  // --- REFS
  const loading = ref(false)

  // Filters
  const filtroRut = ref('')
  const filtroNombre = ref('')
  const tipoCargo = ref('')
  const filtroHabilitado = ref('')

  // Lists
  const listaTipoCargo = ref<string[]>([])
  const listaTipoContrato = ref<string[]>(['PLANTA', 'REEMPLAZO'])
  const listaHabilitado = ref<string[]>([])
  const listaServicios = ref<string[]>([])
  const listaTiposTurno = ref<string[]>([])

  // Modal Visibility
  const updateModalVisible = ref(false)
  const createModalVisible = ref(false)
  const historialModalVisible = ref(false)
  const exportModalVisible = ref(false)

  // Selection
  const usuarioSeleccionado = ref<any>(null)
  const usuarioActual = ref<any>({})
  const historialUsuario = ref<any[]>([])

  // --- SERVER-SIDE PAGINATION
  const currentPage = ref(1)
  const totalPages = computed(() => userStore.pagination.totalPages)
  const itemsPerPage = 10

  const userLoged = computed(() => {
    return authStore.user
  })

  // --- FILTER & SORT LOGIC
  const rolesDisponiblesCreacion = computed(() => {
    if (!userLoged.value) return []
    const cargoActual = userLoged.value.tipo_cargo

    if (cargoActual === 'ADMIN-TI') {
      return listaTipoCargo.value
    } else if (cargoActual === 'RECURSOS HUMANOS') {
      return listaTipoCargo.value.filter((rol) => !['ADMIN-TI', 'RECURSOS HUMANOS'].includes(rol))
    }
    return []
  })

  // Server-side data (from store)
  const usuariosFiltrados = computed(() => userStore.currentPageUsers)
  const paginatedUsuarios = computed(() => userStore.currentPageUsers)

  // Server-side pagination
  async function changePage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      await loadUsers(page)
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
    await loadUsers(currentPage.value) // Reload current page
    closeUpdateModal()
    showAlert?.('Modificado', 'El registro se ha modificado correctamente.')
  }

  async function handleDelete(id: string) {
    await userStore.eliminarUsuario(id)
    await loadUsers(currentPage.value) // Reload current page
    showAlert?.('Eliminado', 'El usuario se ha eliminado correctamente.')
  }

  async function handleCreate(nuevoUsuario: User) {
    try {
      await userStore.crearUsuario(nuevoUsuario)
      await loadUsers(1) // Go to page 1 to see new user
      currentPage.value = 1
      closeCreateModal()
      showAlert?.('Guardado', 'El usuario se ha creado correctamente.')
    } catch (error: any) {
      const message = error.mensaje || error.response?.data?.mensaje || 'Error al crear usuario.'
      showAlert?.('Error', message, 'error')
    }
  }

  async function loadUsers(page: number = 1) {
    loading.value = true
    try {
      // Fetch paginated users from server
      await userStore.fetchPaginated({
        page,
        limit: itemsPerPage,
        search: filtroNombre.value,
        cargo: tipoCargo.value,
        habilitado: filtroHabilitado.value,
        rut: filtroRut.value
      })

      // Load options only once
      if (listaTipoCargo.value.length === 0) {
        const opciones = await optionStore.mostrarOpciones()
        listaTipoCargo.value = opciones.tipoCargo
        listaHabilitado.value = opciones.habilitado
        listaServicios.value = opciones.servicios
        listaTiposTurno.value = opciones.tiposTurno
      }
    } finally {
      loading.value = false
    }
  }

  // Debounced search (waits 300ms after user stops typing)
  const debouncedSearch = debounce(async () => {
    currentPage.value = 1 // Reset to page 1 on search
    await loadUsers(1)
  }, 300)

  // Watch filters and trigger debounced search
  watch([filtroNombre, tipoCargo, filtroHabilitado, filtroRut], () => {
    debouncedSearch()
  })

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
    loading,
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
    listaTipoContrato,
    rolesDisponiblesCreacion,
    listaHabilitado,
    listaServicios,
    listaTiposTurno,

    // Pagination
    currentPage,
    totalPages,
    changePage,

    // Modals Visibility
    updateModalVisible,
    createModalVisible,
    historialModalVisible,
    exportModalVisible,

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
    openExportModal: () => (exportModalVisible.value = true),
    closeExportModal: () => (exportModalVisible.value = false),

    // CRUD
    handleUpdate,
    handleDelete,
    handleCreate,
    loadUsers
  }
}

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { debounce } from 'lodash-es'
import { useUserStore } from '@/stores/user.store'
import { useOptionStore } from '@/stores/option.store'
import { useServiceStore } from '@/stores/service.store'
import { useAuthStore } from '@/stores/auth.store'
import socket from '@/plugins/socket'

export function useEmployeesState() {
  const userStore = useUserStore()
  const optionStore = useOptionStore()
  const serviceStore = useServiceStore()
  const authStore = useAuthStore()

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
  const listaServicios = computed(() => serviceStore.services)
  const listaTiposTurno = ref<string[]>([])

  // --- SERVER-SIDE PAGINATION
  const currentPage = ref(1)
  const totalPages = computed(() => userStore.pagination.totalPages)
  const itemsPerPage = 10

  const userLoged = computed(() => authStore.user)

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

  // --- DATA LOADING ---
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
        listaTiposTurno.value = opciones.tiposTurno
      }
      if (serviceStore.services.length === 0) {
        await serviceStore.fetchServices()
      }
    } finally {
      loading.value = false
    }
  }

  // Server-side pagination
  async function changePage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      await loadUsers(page)
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
    loading,
    usuariosFiltrados,
    paginatedUsuarios,
    userLoged,
    filtroRut,
    filtroNombre,
    tipoCargo,
    filtroHabilitado,
    listaTipoCargo,
    listaTipoContrato,
    rolesDisponiblesCreacion,
    listaHabilitado,
    listaServicios,
    listaTiposTurno,
    currentPage,
    totalPages,
    changePage,
    loadUsers
  }
}

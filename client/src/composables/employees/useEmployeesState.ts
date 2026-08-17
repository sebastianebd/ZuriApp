import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { debounce } from 'lodash-es'
import { useStaffStore } from '@/stores/staff.store'
import { useServiceStore } from '@/stores/service.store'
import { useAuthStore } from '@/stores/auth.store'
import { useRoleStore } from '@/stores/role.store'
import { usePositionStore } from '@/stores/position.store'
import socket from '@/plugins/socket'

export function useEmployeesState() {
  const staffStore = useStaffStore()
  const serviceStore = useServiceStore()
  const authStore = useAuthStore()
  const roleStore = useRoleStore()
  const positionStore = usePositionStore()

  // --- REFS
  const loading = ref(false)

  // Filters
  const filtroRut = ref('')
  const filtroNombre = ref('')
  const positionId = ref('')
  const filtroHabilitado = ref('')

  // Lists
  const listaRoles = computed(() => roleStore.roles)
  const listaPositions = computed(() => positionStore.positions)
  const listaTipoContrato = ref<string[]>(['CONTRATA', 'PLANTA', 'HONORARIO'])
  const listaHabilitado = ref<string[]>(['HABILITADO', 'INACTIVO'])
  const listaServicios = computed(() => serviceStore.services)
  const listaTiposTurno = ref<string[]>([])

  // --- SERVER-SIDE PAGINATION
  const currentPage = ref(1)
  const totalPages = computed(() => staffStore.pagination.totalPages)
  const itemsPerPage = 10

  const userLoged = computed(() => authStore.IStaff)

  // --- FILTER & SORT LOGIC
  const rolesDisponiblesCreacion = computed(() => {
    if (!userLoged.value || !userLoged.value.role) return []
    const myLevel = userLoged.value.role.level || 0
    return listaRoles.value.filter((rol) => rol.level < myLevel)
  })

  // Server-side data (from store)
  const usuariosFiltrados = computed(() => staffStore.currentPageStaff)
  const paginatedUsuarios = computed(() => staffStore.currentPageStaff)

  // --- DATA LOADING ---
  async function loadUsers(page: number = 1) {
    loading.value = true
    try {
      // Fetch paginated users from server
      await staffStore.fetchPaginated({
        page,
        limit: itemsPerPage,
        search: filtroNombre.value,
        positionId: positionId.value,
        isActive:
          filtroHabilitado.value === 'HABILITADO'
            ? true
            : filtroHabilitado.value === 'INACTIVO'
            ? false
            : undefined,
        rut: filtroRut.value
      })

      // Load options only once
      if (serviceStore.services.length === 0) {
        await serviceStore.fetchServices()
      }
      if (roleStore.roles.length === 0) {
        await roleStore.fetchRoles()
      }
      if (positionStore.positions.length === 0) {
        await positionStore.fetchPositions()
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

  // Debounced search (waits 300ms after IStaff stops typing)
  const debouncedSearch = debounce(async () => {
    currentPage.value = 1 // Reset to page 1 on search
    await loadUsers(1)
  }, 300)

  // Watch filters and trigger debounced search
  watch([filtroNombre, positionId, filtroHabilitado, filtroRut], () => {
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
    positionId,
    filtroHabilitado,
    listaRoles,
    listaPositions,
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

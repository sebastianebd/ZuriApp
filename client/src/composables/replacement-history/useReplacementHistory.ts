import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
// import { useAuthStore } from '@/stores/auth.store' // Unused
import { useOptionStore } from '@/stores/option.store'
import { useReplacementStore } from '@/stores/replacement.store'
import { type ReplacementRegistration } from '@/types/replacement.types'
import { type User } from '@/types/user.types'
import socket from '@/plugins/socket'
import { debounce } from 'lodash-es'

export function useHistory() {
  // --- ESTADO Y STORES ---
  // const authStore = useAuthStore() // No longer needed directly
  // const useApi = authStore.usePrivateApi() // No longer needed directly
  const optionStore = useOptionStore()
  const replacementStore = useReplacementStore()

  const cargando = ref(true)
  const listaDeServicios = ref<string[]>([])

  // --- ESTADO DE FILTROS ---
  const filtros = ref({
    rutSaliente: '',
    rutEntrante: '',
    fechaInicio: '',
    fechaFin: '',
    servicio: ''
  })

  // --- ESTADO DE PAGINACIÓN (Mapeado al Store) ---
  const reemplazosHistorico = computed(() => replacementStore.finalizedReplacements)
  const currentPage = computed(() => replacementStore.finalizedPagination.currentPage)
  const totalPages = computed(() => replacementStore.finalizedPagination.totalPages)
  const totalRegistros = computed(() => replacementStore.finalizedPagination.totalItems)
  // const itemsPerPage = 10 // Managed by store

  async function cargarHistorial(page: number = 1) {
    cargando.value = true
    try {
      // ✅ Usa la acción paginada del Store
      await replacementStore.fetchFinalizedPaginated(filtros.value, page)
    } catch (error) {
      console.error('Error al cargar historial paginado:', error)
      // Store maneja el error internamente, pero podríamos limpiar aquí si fuera necesario
    } finally {
      cargando.value = false
    }
  }

  // ✅ DEBOUNCE (300ms)
  const debouncedSearch = debounce(() => {
    cargarHistorial(1) // Siempre volver a pág 1 al filtrar
  }, 300)

  // Watch profundo a filtros
  watch(
    filtros,
    () => {
      debouncedSearch()
    },
    { deep: true }
  )

  const handleFiltroCambiado = () => {
    // Legacy mapping (view calls this, but watcher handles it now)
    // Mantener vacío o remover si la vista usa v-model directo
    // La vista usa @update:model-value="handleFiltroCambiado", así que lo dejamos compatible
    // pero el trabajo real lo hace el watcher
  }

  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      cargarHistorial(page)
    }
  }

  const limpiarFiltros = () => {
    filtros.value = {
      rutSaliente: '',
      rutEntrante: '',
      fechaInicio: '',
      fechaFin: '',
      servicio: ''
    }
    // El watcher detectará el cambio y recargará
  }

  const formatearFecha = (fecha: string) => {
    if (!fecha) return ''
    return new Date(fecha).toISOString().split('T')[0].split('-').reverse().join('-')
  }

  const getCreatorName = (reemplazo: ReplacementRegistration): string => {
    const creator = reemplazo.creado_por
    if (typeof creator !== 'string' && creator && 'nombre' in creator && 'apellido' in creator) {
      const user = creator as User
      return `${user.nombre} ${user.apellido}`
    }
    return String(creator) || 'Usuario no asignado'
  }

  function getInitials(name: string) {
    if (!name) return '?'
    return name
      .split(' ')
      .filter((n) => n.length > 0)
      .map((n: string) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  onMounted(async () => {
    try {
      const opciones = await optionStore.mostrarOpciones()
      listaDeServicios.value = opciones.servicios

      // Carga inicial
      await cargarHistorial(currentPage.value)

      socket.on('history:update', async () => {
        await cargarHistorial(currentPage.value)
      })
    } catch (error) {
      console.error('Error en el montaje:', error)
    }
  })

  onUnmounted(() => {
    socket.off('history:update')
  })

  return {
    reemplazosHistorico,
    listaDeServicios,
    cargando,
    filtros,
    currentPage,
    totalPages,
    totalRegistros,
    cargarHistorial,
    handleFiltroCambiado,
    changePage,
    limpiarFiltros,
    formatearFecha,
    getCreatorName,
    getInitials
  }
}

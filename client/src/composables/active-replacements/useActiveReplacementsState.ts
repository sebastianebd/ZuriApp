import { ref, computed, watch, onMounted } from 'vue'
import { useTurnTypeStore } from '@/stores/turn-type.store'
import { usePositionStore } from '@/stores/position.store'
import { useServiceStore } from '@/stores/service.store'
import { useReplacementStore } from '@/stores/replacement.store'

interface StateDependencies {
  createModalVisible: { value: boolean }
  updateModalVisible: { value: boolean }
  registroNuevo: { value: any }
  registroActual: { value: any }
}

export function useActiveReplacementsState(deps?: StateDependencies) {
  const replacementStore = useReplacementStore()
  const turnTypeStore = useTurnTypeStore()
  const positionStore = usePositionStore()
  const serviceStore = useServiceStore()

  const listaDeTurnos = computed(() => turnTypeStore.turnTypes.map((t: any) => t.nombre || t.name))
  const listaDeServicios = computed(() => serviceStore.services)
  const listaDeCargos = computed(() => positionStore.positions)

  // Server-side pagination state
  const currentPage = ref(1)
  const itemsPerPage = ref(10)

  // Computed: Total pages from store
  const totalPages = computed(() => replacementStore.paginationInfo.totalPages)

  // Computed: Current page replacements (server-side paginated)
  const paginatedReplacements = computed(() => replacementStore.reemplazosFiltrados)

  onMounted(async () => {
    try {
      // Load Reference Data
      if (turnTypeStore.turnTypes.length === 0) {
        await turnTypeStore.fetchTurnTypes(true)
      }
      if (positionStore.positions.length === 0) {
        await positionStore.fetchPositions()
      }
      if (serviceStore.services.length === 0) {
        await serviceStore.fetchServices()
      }

      // Load Initial Data
      await replacementStore.fetchActiveReplacementsPaginated({
        page: currentPage.value,
        limit: itemsPerPage.value,
        fechaInicio: replacementStore.fechaInicio,
        fechaFin: replacementStore.fechaFin,
        rutSaliente: replacementStore.filtroRutSaliente,
        rutEntrante: replacementStore.filtroRutEntrante,
        servicio: replacementStore.filtroServicio
      })
    } catch (error) {
      console.error('[useReplacements] Error loading data:', error)
    }
  })

  // Page change handler
  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  // Watch for page changes and fetch data
  watch(currentPage, async () => {
    await replacementStore.fetchActiveReplacementsPaginated({
      page: currentPage.value,
      limit: itemsPerPage.value,
      fechaInicio: replacementStore.fechaInicio,
      fechaFin: replacementStore.fechaFin,
      rutSaliente: replacementStore.filtroRutSaliente,
      rutEntrante: replacementStore.filtroRutEntrante,
      servicio: replacementStore.filtroServicio
    })
  })

  // Watch for filter changes and fetch data (resetting to page 1)
  watch(
    [
      () => replacementStore.fechaInicio,
      () => replacementStore.fechaFin,
      () => replacementStore.filtroRutSaliente,
      () => replacementStore.filtroRutEntrante,
      () => replacementStore.filtroServicio
    ],
    async () => {
      currentPage.value = 1
      await replacementStore.fetchActiveReplacementsPaginated({
        page: currentPage.value,
        limit: itemsPerPage.value,
        fechaInicio: replacementStore.fechaInicio,
        fechaFin: replacementStore.fechaFin,
        rutSaliente: replacementStore.filtroRutSaliente,
        rutEntrante: replacementStore.filtroRutEntrante,
        servicio: replacementStore.filtroServicio
      })
    }
  )

  const fechasOcupadas = computed(() => {
    if (!deps) return []
    let entranteId: string | undefined
    if (deps.createModalVisible.value) {
      entranteId = deps.registroNuevo.value.id_entrante
    } else if (deps.updateModalVisible.value) {
      entranteId = deps.registroActual.value.id_entrante
    }
    if (!entranteId) return []
    return replacementStore.getFechasOcupadas(entranteId)
  })

  return {
    listaDeTurnos,
    listaDeServicios,
    listaDeCargos,
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedReplacements,
    changePage,
    fechasOcupadas
  }
}

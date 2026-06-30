import { ref, computed, watch, onMounted } from 'vue'
import { useOptionStore } from '@/stores/option.store'
import { useReplacementStore } from '@/stores/replacement.store'

interface StateDependencies {
  createModalVisible: { value: boolean }
  updateModalVisible: { value: boolean }
  registroNuevo: { value: any }
  registroActual: { value: any }
}

export function useActiveReplacementsState(deps?: StateDependencies) {
  const replacementStore = useReplacementStore()
  const optionStore = useOptionStore()

  const listaDeTurnos = ref<string[]>([])
  const listaDeServicios = ref<string[]>([])
  const listaDeCargos = ref<string[]>([])

  // Server-side pagination state
  const currentPage = ref(1)
  const itemsPerPage = ref(10)

  // Computed: Total pages from store
  const totalPages = computed(() => replacementStore.paginationInfo.totalPages)

  // Computed: Current page replacements (server-side paginated)
  const paginatedReplacements = computed(() => replacementStore.reemplazosFiltrados)

  onMounted(async () => {
    try {
      // Load Options
      const opciones = await optionStore.mostrarOpciones()
      listaDeTurnos.value = opciones.tiposTurno || []
      listaDeServicios.value = opciones.servicios || []
      listaDeCargos.value = opciones.tipoCargo || []

      // Load Initial Data
      await replacementStore.fetchActiveReplacementsPaginated({
        page: currentPage.value,
        limit: itemsPerPage.value
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
      limit: itemsPerPage.value
    })
  })

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

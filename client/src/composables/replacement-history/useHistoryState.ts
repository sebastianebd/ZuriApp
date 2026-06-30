import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useOptionStore } from '@/stores/option.store'
import { useReplacementStore } from '@/stores/replacement.store'
import socket from '@/plugins/socket'
import { debounce } from 'lodash-es'

export function useHistoryState() {
  const optionStore = useOptionStore()
  const replacementStore = useReplacementStore()

  const cargando = ref(true)
  const listaDeServicios = ref<string[]>([])

  const filtros = ref({
    rutSaliente: '',
    rutEntrante: '',
    fechaInicio: '',
    fechaFin: '',
    servicio: ''
  })

  const reemplazosHistorico = computed(() => replacementStore.finalizedReplacements)
  const currentPage = computed(() => replacementStore.finalizedPagination.currentPage)
  const totalPages = computed(() => replacementStore.finalizedPagination.totalPages)
  const totalRegistros = computed(() => replacementStore.finalizedPagination.totalItems)

  async function cargarHistorial(page: number = 1) {
    cargando.value = true
    try {
      await replacementStore.fetchFinalizedPaginated(filtros.value, page)
    } catch (error) {
      console.error('Error al cargar historial paginado:', error)
    } finally {
      cargando.value = false
    }
  }

  const debouncedSearch = debounce(() => {
    cargarHistorial(1)
  }, 300)

  watch(
    filtros,
    () => {
      debouncedSearch()
    },
    { deep: true }
  )

  const handleFiltroCambiado = () => {}

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
  }

  onMounted(async () => {
    try {
      const opciones = await optionStore.mostrarOpciones()
      listaDeServicios.value = opciones.servicios

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
    limpiarFiltros
  }
}

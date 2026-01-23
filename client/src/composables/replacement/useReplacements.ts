import { ref, computed, inject, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useOptionStore } from '@/stores/option.store'
import { useReplacementStore } from '@/stores/replacement.store'
import { useReplacementModals } from '@/composables/useReplacementModals'
import type { RegisterDataReemplazo } from '@/types/models'

export function useReplacements() {
  const showAlert = inject<(title: string, message: string) => void>('showAlert')

  const replacementStore = useReplacementStore()
  const authStore = useAuthStore()
  const optionStore = useOptionStore()

  const userLoged = computed(() => authStore.userDetail)
  const listaDeTurnos = ref<string[]>([])
  const listaDeServicios = ref<string[]>([])
  const listaDeCargos = ref<string[]>([])

  // 🏢 ENTERPRISE: Load options data on mount
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

  // Server-side pagination state
  const currentPage = ref(1)
  const itemsPerPage = ref(10)

  // Computed: Total pages from store
  const totalPages = computed(() => replacementStore.paginationInfo.totalPages)

  // Computed: Current page replacements (server-side paginated)
  const paginatedReplacements = computed(() => replacementStore.reemplazosFiltrados)

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

  // B. Modales y Datos
  const modalLogic = useReplacementModals()
  const {
    createModalVisible,
    updateModalVisible,
    registroNuevo,
    registroActual,
    nuevoEntranteSustitucion
  } = modalLogic

  // --- ACTIONS ---

  const handleSustitucion = () => {
    modalLogic.handleSustitucion()
  }

  const confirmarSustitucion = async () => {
    if (!nuevoEntranteSustitucion.value.rut_entrante) {
      showAlert?.('Error', 'Debe asignar un nuevo funcionario para la sustitución.')
      return
    }
    try {
      const datosSustitucion = modalLogic.createSustitucionPayload()
      await replacementStore.procesarSustitucion(datosSustitucion)
      modalLogic.closeSubstituteModal()
      showAlert?.(
        'Sustitución Exitosa',
        'El reemplazo fue segmentado y el nuevo funcionario asignado.'
      )
    } catch (error) {
      showAlert?.('Error', 'Hubo un error al procesar la sustitución.')
    }
  }

  const openUpdateModal = (reemplazo: RegisterDataReemplazo) => {
    const reemplazoConCargo = { ...reemplazo, tipo_cargo: reemplazo.tipo_cargo || '' }
    modalLogic.openUpdateModal(reemplazoConCargo)
  }

  const openCreateModal = () => {
    if (userLoged.value && userLoged.value._id) {
      modalLogic.openCreateModal(userLoged.value._id)
    } else {
      showAlert?.('Error', 'No se pudo identificar al usuario creador.')
    }
  }

  const guardarNuevoReemplazo = async (nuevoReemplazo: RegisterDataReemplazo) => {
    await replacementStore.crearReemplazo(nuevoReemplazo)
    modalLogic.closeCreateModal()
    showAlert?.('Guardado', 'El registro se ha guardado correctamente.')
  }

  const handleFinalizar = async (id: string) => {
    await replacementStore.finalizarReemplazo(id)
    showAlert?.('Finalizado', 'El registro se ha finalizado correctamente.')
  }

  const handleUpdate = async () => {
    if (registroActual.value._id) {
      await replacementStore.actualizarReemplazo(
        registroActual.value._id,
        registroActual.value as RegisterDataReemplazo
      )
    }
    modalLogic.closeUpdateModal()
    showAlert?.('Modificado', 'El registro se ha modificado correctamente.')
  }

  const handleAnular = async (id: string) => {
    await replacementStore.anularReemplazo(id)
    showAlert?.('Anulado', 'El registro se ha anulado correctamente.')
  }

  const fechasOcupadas = computed(() => {
    let entranteId: string | undefined
    if (createModalVisible.value) {
      entranteId = registroNuevo.value.id_entrante
    } else if (updateModalVisible.value) {
      entranteId = registroActual.value.id_entrante
    }
    if (!entranteId) return []
    return replacementStore.getFechasOcupadas(entranteId)
  })

  return {
    replacementStore,
    paginatedReplacements,
    currentPage,
    totalPages,
    changePage,

    // Data Lists
    listaDeTurnos,
    listaDeServicios,
    listaDeCargos,

    fechasOcupadas,

    // Modal Logic (exposed from useReplacementModals)
    ...modalLogic,

    // Actions Wrappers
    openCreateModal,
    openUpdateModal,
    guardarNuevoReemplazo,
    handleFinalizar,
    handleAnular,
    handleUpdate,
    handleSustitucion,
    confirmarSustitucion
  }
}

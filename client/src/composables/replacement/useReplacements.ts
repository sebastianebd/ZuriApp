import { ref, computed, inject, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'
import { useOptionStore } from '@/stores/option.store'
import { useReplacementStore } from '@/stores/replacement.store'
import { useTurnTypeStore } from '@/stores/turn-type.store'
import { useReplacementModals } from '@/composables/useReplacementModals'
import type { User, RegisterDataReemplazo } from '@/types/models'
import socket from '@/plugins/socket'

export function useReplacements() {
  const showAlert = inject<(title: string, message: string) => void>('showAlert')

  const replacementStore = useReplacementStore()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const optionStore = useOptionStore()
  const apiPrivate = authStore.usePrivateApi()

  const userLoged = computed(() => authStore.userDetail)
  const listaDeTurnos = ref<string[]>([])
  const listaDeServicios = ref<string[]>([])
  const listaDeCargos = ref<string[]>([])

  // 🏢 ENTERPRISE: Load options data on mount
  onMounted(async () => {
    try {
      const opciones = await optionStore.mostrarOpciones()
      listaDeTurnos.value = opciones.tiposTurno || []
      listaDeServicios.value = opciones.servicios || []
      listaDeCargos.value = opciones.tipoCargo || []
      console.log('[useReplacements] Options loaded:', {
        turnos: listaDeTurnos.value.length,
        servicios: listaDeServicios.value.length,
        cargos: listaDeCargos.value.length
      })
    } catch (error) {
      console.error('[useReplacements] Error loading options:', error)
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
    substituteModalVisible,
    registroNuevo,
    registroActual,
    grupo,
    cargoDeFiltrado,
    nuevoEntranteSustitucion
  } = modalLogic

  // --- ACTIONS ---

  const seleccionarEntranteEnEdicion = () => {
    modalLogic.openUserModal(2)
  }

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

  const seleccionarGrupo = (numeroGrupo: 1 | 2) => {
    modalLogic.openUserModal(numeroGrupo)
  }

  const seleccionarUsuario = (usuario: User) => {
    if (substituteModalVisible.value) {
      Object.assign(nuevoEntranteSustitucion.value, {
        id_entrante: usuario._id,
        rut_entrante: usuario.rut,
        nombre_entrante: usuario.nombre,
        apellido_entrante: usuario.apellido
      })
      modalLogic.closeUserModal()
    } else if (updateModalVisible.value) {
      Object.assign(registroActual.value, {
        id_entrante: usuario._id,
        rut_entrante: usuario.rut,
        nombre_entrante: usuario.nombre,
        apellido_entrante: usuario.apellido
      })
      modalLogic.closeUserModal()
    } else if (createModalVisible.value) {
      if (grupo.value === 1) {
        Object.assign(registroNuevo.value, {
          id_saliente: usuario._id,
          rut_saliente: usuario.rut,
          nombre_saliente: usuario.nombre,
          apellido_saliente: usuario.apellido
        })
        modalLogic.setCargoDeFiltrado(usuario.tipo_cargo)
      } else if (grupo.value === 2) {
        Object.assign(registroNuevo.value, {
          id_entrante: usuario._id,
          rut_entrante: usuario.rut,
          nombre_entrante: usuario.nombre,
          apellido_entrante: usuario.apellido
        })
      }
      modalLogic.closeUserModal()
    }
  }

  const openUpdateModal = (reemplazo: RegisterDataReemplazo) => {
    const reemplazoConCargo = { ...reemplazo, tipo_cargo: reemplazo.tipo_cargo || '' }
    modalLogic.openUpdateModal(reemplazoConCargo)
  }

  const usuariosFiltradosPorCargo = computed(() => {
    if (grupo.value === 2 && cargoDeFiltrado.value) {
      return userStore.users.filter((u) => u.tipo_cargo === cargoDeFiltrado.value)
    }
    return userStore.users
  })

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
      await replacementStore.actualizarReemplazo(registroActual.value._id, registroActual.value)
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
    usuariosFiltradosPorCargo,
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
    seleccionarEntranteEnEdicion,
    handleSustitucion,
    confirmarSustitucion,
    seleccionarGrupo,
    seleccionarUsuario
  }
}

import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useOptionStore } from '@/stores/option.store'
import { useReplacementStore } from '@/stores/replacement.store'
import { useTurnTypeStore } from '@/stores/turn-type.store'
import { mostrarTodosUsuarios } from '@/services/user.service'
import { useReplacementModals } from '@/composables/useReplacementModals'
import type { User, RegisterDataReemplazo } from '@/types/models'
import socket from '@/plugins/socket'

export function useReplacements() {
  const showAlert = inject<(title: string, message: string) => void>('showAlert')

  const replacementStore = useReplacementStore()
  const authStore = useAuthStore()
  const optionStore = useOptionStore()
  const apiPrivate = authStore.usePrivateApi()

  const userLoged = computed(() => authStore.userDetail)
  const listaDeTurnos = ref<string[]>([])
  const listaDeServicios = ref<string[]>([])
  const listaDeCargos = ref<string[]>([])
  const usuarios = ref<User[]>([])

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
    } else if (updateModalVisible.value) {
      Object.assign(registroActual.value, {
        id_entrante: usuario._id,
        rut_entrante: usuario.rut,
        nombre_entrante: usuario.nombre,
        apellido_entrante: usuario.apellido
      })
    } else if (createModalVisible.value) {
      const isSaliente = grupo.value === 1
      modalLogic.assignUserData(registroNuevo.value, usuario, isSaliente)
    }
    modalLogic.closeUserModal()
  }

  const openUpdateModal = (reemplazo: RegisterDataReemplazo) => {
    const saliente = usuarios.value.find((u) => u._id === reemplazo.id_saliente)
    let reemplazoConCargo: RegisterDataReemplazo
    if (saliente && saliente.tipo_cargo) {
      reemplazoConCargo = { ...reemplazo, tipo_cargo: saliente.tipo_cargo } as RegisterDataReemplazo
    } else {
      reemplazoConCargo = reemplazo
    }
    modalLogic.openUpdateModal(reemplazoConCargo)
  }

  const usuariosFiltradosPorCargo = computed(() => {
    if (grupo.value === 2 && cargoDeFiltrado.value) {
      return usuarios.value.filter((u) => u.tipo_cargo === cargoDeFiltrado.value)
    }
    return usuarios.value
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

  // --- LIFECYCLE ---

  async function loadData() {
    // Fetch first page of replacements with server-side pagination
    await replacementStore.fetchActiveReplacementsPaginated({
      page: currentPage.value,
      limit: itemsPerPage.value
    })

    const [opciones, usuariosCargados] = await Promise.all([
      optionStore.mostrarOpciones(),
      mostrarTodosUsuarios(apiPrivate),
      useTurnTypeStore().fetchTurnTypes(true)
    ])
    const turnTypes = useTurnTypeStore().turnTypes
    listaDeTurnos.value = turnTypes.map((t) => t.nombre)
    listaDeServicios.value = opciones.servicios
    listaDeCargos.value = opciones.tipoCargo
    usuarios.value = usuariosCargados as User[]
  }

  onMounted(async () => {
    await loadData()

    socket.on('replacements:update', async () => {
      // Refresh current page on socket update
      await replacementStore.fetchActiveReplacementsPaginated({
        page: currentPage.value,
        limit: itemsPerPage.value
      })
    })
  })

  onUnmounted(() => {
    socket.off('replacements:update')
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
    seleccionarUsuario,
    loadData
  }
}

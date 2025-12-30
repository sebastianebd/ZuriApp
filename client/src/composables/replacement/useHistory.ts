import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useOptionStore } from '@/stores/option.store'
import { obtenerInactivosPaginados } from '@/services/replacement.service'
import type { RegisterDataReemplazo, User } from '@/types/models'
import socket from '@/plugins/socket'

export function useHistory() {
  // --- ESTADO Y STORES ---
  const authStore = useAuthStore()
  const useApi = authStore.usePrivateApi()
  const optionStore = useOptionStore()

  // --- ESTADO DE PAGINACIÓN Y DATOS ---
  const reemplazosHistorico = ref<RegisterDataReemplazo[]>([])
  const listaDeServicios = ref<string[]>([])
  const cargando = ref(true)

  // --- ESTADO DE FILTROS ---
  const filtros = ref({
    rutSaliente: '',
    rutEntrante: '',
    fechaInicio: '',
    fechaFin: '',
    servicio: ''
  })

  // --- ESTADO DE PAGINACIÓN ---
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalRegistros = ref(0)
  const itemsPerPage = 10

  async function cargarHistorial() {
    cargando.value = true
    try {
      const resultado = await obtenerInactivosPaginados(
        useApi,
        filtros.value,
        currentPage.value,
        itemsPerPage
      )
      reemplazosHistorico.value = resultado.registros
      totalPages.value = resultado.totalPages
      totalRegistros.value = resultado.totalRegistros
    } catch (error) {
      console.error('Error al cargar historial paginado:', error)
      reemplazosHistorico.value = []
      totalRegistros.value = 0
      totalPages.value = 1
    } finally {
      cargando.value = false
    }
  }

  const handleFiltroCambiado = () => {
    currentPage.value = 1
    cargarHistorial()
  }

  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      cargarHistorial()
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
    currentPage.value = 1
    cargarHistorial()
  }

  const formatearFecha = (fecha: string) => {
    if (!fecha) return ''
    return new Date(fecha).toISOString().split('T')[0].split('-').reverse().join('-')
  }

  const getCreatorName = (reemplazo: RegisterDataReemplazo): string => {
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
      await cargarHistorial()

      socket.on('history:update', async () => {
        await cargarHistorial()
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

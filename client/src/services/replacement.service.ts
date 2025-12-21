import { errorHandler } from '@/utils/errorHandler'
import type { useApiPrivate } from '../composables/useApi'
import type { RegisterDataReemplazo, SustitucionPayload } from '../types/models'

// 💡 Interfaz para la respuesta del backend
interface PaginacionResult {
  registros: RegisterDataReemplazo[]
  totalRegistros: number
  paginaActual: number
  limite: number
  totalPages: number
}

// 💡 Interfaz para los filtros del historial (igual que en el componente)
interface FiltrosHistorial {
  rutSaliente?: string
  rutEntrante?: string
  fechaInicio?: string
  fechaFin?: string
  servicio?: string
}

// -----------------------------------------------------
// 💡 NUEVA FUNCIÓN: OBTENER INACTIVOS PAGINADOS
// -----------------------------------------------------
export const obtenerInactivosPaginados = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  filtros: FiltrosHistorial,
  pagina: number,
  limite: number
): Promise<PaginacionResult> => {
  try {
    const params = {
      ...filtros,
      pagina,
      limite
    }

    const { data } = await apiPrivate.get('/reemplazos/historial-paginado', {
      params: params
    })

    return data as PaginacionResult
  } catch (error) {
    throw errorHandler(error)
  }
}

export const crearReemplazo = async (
  payload: RegisterDataReemplazo,
  apiPrivate: ReturnType<typeof useApiPrivate>
) => {
  try {
    const { data } = await apiPrivate.post('/reemplazos/', payload)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const actualizarReemplazo = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  reemplazoId: string,
  payload: RegisterDataReemplazo
) => {
  try {
    const { data } = await apiPrivate.put(`/reemplazos/${reemplazoId}`, payload)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const finalizarReemplazo = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  id: string
) => {
  try {
    const { data } = await apiPrivate.put(`/reemplazos/finalizar/${id}`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

//SE DEBE CAMBIAR EL ENDPOINT
export const anularReemplazo = async (apiPrivate: ReturnType<typeof useApiPrivate>, id: string) => {
  try {
    const { data } = await apiPrivate.put(`/reemplazos/anular/${id}`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const mostrarReemplazos = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.get(`/reemplazos/`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const mostrarHistorialReeemplazos = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.get(`/reemplazos/historial`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const mostrarHistorialUsuario = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  id: string
) => {
  try {
    const { data } = await apiPrivate.get(`/reemplazos/${id}`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const procesarSustitucion = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  payload: SustitucionPayload
) => {
  try {
    // LLAMADA AL NUEVO ENDPOINT
    const { data } = await apiPrivate.post(`/reemplazos/sustituir`, payload)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

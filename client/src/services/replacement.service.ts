import { errorHandler } from '@/utils/errorHandler'
import type { useApiPrivate } from '../composables/useApi'
import type { RegisterDataReemplazo } from '../types/models'


export const crearReemplazo = async (payload: RegisterDataReemplazo,
  apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.post('/api/reemplazos/', payload)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const actualizarReemplazo = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  reemplazoId: string, 
  payload: RegisterDataReemplazo,
) => {
  try {
    const { data } = await apiPrivate.put(`/api/reemplazos/${reemplazoId}`, payload)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const eliminarReemplazo = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  id: string, 
) => {
  try {
    const { data } = await apiPrivate.delete(`/api/reemplazos/${id}`,)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const mostrarReemplazos = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.get(`/api/reemplazos/`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const mostrarHistorialReeemplazos = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.get(`/api/reemplazos/historial`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const mostrarHistorialUsuario = async (apiPrivate: ReturnType<typeof useApiPrivate>, id: string) => {
  try {
    const { data } = await apiPrivate.get(`/api/reemplazos/${id}`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

import { useApiPrivate } from '../composables/useApi'
import { errorHandler } from '../utils/errorHandler'

export const mostrarOpciones = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data: servicios } = await apiPrivate.get(`/api/auth/servicios`)
    const { data: tiposTurno } = await apiPrivate.get(`/api/auth/tipoTurnos`)
    const { data: tipoCargo } = await apiPrivate.get(`/api/auth/tipoCargo`)
    const { data: habilitado } = await apiPrivate.get(`/api/auth/habilitado`)
    
    return {
      servicios,
      tiposTurno,
      tipoCargo,
      habilitado
    }
  } catch (error) {
    throw errorHandler(error)
  }
}
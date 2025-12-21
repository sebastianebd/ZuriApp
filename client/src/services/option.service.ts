import type { useApiPrivate } from '../composables/useApi'
import { errorHandler } from '../utils/errorHandler'

export const mostrarOpciones = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data: servicios } = await apiPrivate.get('/options/servicios')
    const { data: tiposTurno } = await apiPrivate.get('/options/tipo-turnos')
    const { data: tipoCargo } = await apiPrivate.get('/options/tipo-cargos')
    const { data: habilitado } = await apiPrivate.get('/options/habilitado')

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

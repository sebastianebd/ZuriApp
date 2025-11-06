import { errorHandler } from '@/utils/errorHandler'
import { useApiPrivate } from '../composables/useApi'
import type { registrarUsuario } from '../types/models'

export const crearUsuario = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  payload: registrarUsuario
) => {
  try {
    const { data } = await apiPrivate.post('/api/users/', payload)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const actualizarUsuario = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  usuarioId: string,
  payload: registrarUsuario
) => {
  try {
    const { data } = await apiPrivate.put(`/api/users/${usuarioId}`, payload)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const eliminarUsuario = async (apiPrivate: ReturnType<typeof useApiPrivate>, id: string) => {
  try {
    const { data } = await apiPrivate.delete(`/api/users/${id}`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const mostrarUsersCargoTens = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.get(`/api/users/tens`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const mostrarTodosUsuarios = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.get(`/api/users/`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

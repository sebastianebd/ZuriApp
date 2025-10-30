import { errorHandler } from '@/utils/errorHandler'
import { useApiPrivate } from '../composables/useApi'
import type { registrarUsuario } from '../types/models'

export const register = async (
  payload: registrarUsuario,
  apiPrivate: ReturnType<typeof useApiPrivate>
) => {
  try {
    const { data } = await apiPrivate.post('/api/auth/register', payload)
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
    const { data } = await apiPrivate.put(`/api/auth/actualizarUsuario/${usuarioId}`, payload)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const eliminarUsuario = async (apiPrivate: ReturnType<typeof useApiPrivate>, id: string) => {
  try {
    const { data } = await apiPrivate.delete(`/api/auth/eliminarUsuario/${id}`)
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
    const { data } = await apiPrivate.get(`/api/auth/mostrarTodos`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

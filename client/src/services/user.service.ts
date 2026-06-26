import { errorHandler } from '@/utils/errorHandler'
import type { useApiPrivate } from '../composables/useApi'
import { type UserRegistration } from '../types/user.types'

export const crearUsuario = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  payload: UserRegistration
) => {
  try {
    const { data } = await apiPrivate.post('/users/', payload)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const actualizarUsuario = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  usuarioId: string,
  payload: UserRegistration
) => {
  try {
    const { data } = await apiPrivate.put(`/users/${usuarioId}`, payload)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const eliminarUsuario = async (apiPrivate: ReturnType<typeof useApiPrivate>, id: string) => {
  try {
    const { data } = await apiPrivate.delete(`/users/${id}`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const mostrarUsersCargoTens = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.get(`/users/tens`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const mostrarTodosUsuarios = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  search?: string,
  limit?: number
) => {
  try {
    const { data } = await apiPrivate.get(`/users/`, {
      params: {
        search,
        limit // Optional: for modals, pass large limit to get all users
      }
    })
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

// 🏢 ENTERPRISE: Server-side search for scalable user selection
export const searchUsers = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  params: {
    search: string
    page?: number
    limit?: number
  }
) => {
  try {
    const { data } = await apiPrivate.get(`/users/`, {
      params: {
        search: params.search,
        page: params.page || 1,
        limit: params.limit || 20
      }
    })
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

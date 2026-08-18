import { useApi, useApiPrivate } from '../composables/useApi'
import { type LoginData } from '../types/auth.types'
import { errorHandler } from '../utils/errorHandler'

const Api = useApi()

export const login = async (payload: LoginData) => {
  try {
    const { data } = await Api.post('/auth/login', payload)
    return data
  } catch (error) {
    throw errorHandler(error, true)
  }
}

export const refresh = async () => {
  try {
    const { data } = await Api.post('/auth/refresh')
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const logout = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.post('/auth/logout')
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const getUser = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.get('/auth/me')
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const changePassword = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  payload: { currentPassword: string; newPassword: string; confirmPassword: string }
) => {
  try {
    const { data } = await apiPrivate.post('/auth/change-password', payload)
    return data
  } catch (error) {
    throw errorHandler(error, true)
  }
}

export const getLoginHistory = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.get('/auth/history')
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

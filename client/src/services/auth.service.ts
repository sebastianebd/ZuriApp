// src/services/auth.service.ts
import { useApi, useApiPrivate } from '../composables/useApi'
import type { LoginData } from '../types/models'
import { errorHandler } from '../utils/errorHandler'

const Api = useApi()

export const login = async (payload: LoginData) => {
  try {
    const { data } = await Api.post('/api/auth/login', payload)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const refresh = async () => {
  try {
    const { data } = await Api.post('/api/auth/refresh')
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const logout = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.post('/api/auth/logout')
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const getUser = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.get('/api/auth/user')
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

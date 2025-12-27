import { axiosInstance, axiosPrivateInstance } from '../config/axios'
import type { AxiosInstance } from 'axios'

export let interceptorsInitialized = false

export function resetInterceptors() {
  console.log('UseApi: Resetting interceptors')
  interceptorsInitialized = false
}

export function authRequestInterceptor(getAccessToken: () => string) {
  return (config: any) => {
    const token = getAccessToken()
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  }
}

export function authResponseErrorInterceptor(
  refreshToken: () => Promise<string>,
  logout: () => Promise<void>
) {
  return async (error: any) => {
    const prevRequest = error?.config

    if ((error?.response?.status === 401 || error?.response?.status === 403) && !prevRequest.sent) {
      prevRequest.sent = true
      try {
        const newAccessToken = await refreshToken()
        prevRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
        return axiosPrivateInstance(prevRequest)
      } catch (refreshError) {
        console.error('Auto-logout failed, forcing redirect', refreshError)
        await logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
}

export function useApiPrivate(
  getAccessToken: () => string,
  refreshToken: () => Promise<string>,
  logout: () => Promise<void>
): AxiosInstance {
  if (!interceptorsInitialized) {
    interceptorsInitialized = true

    axiosPrivateInstance.interceptors.request.use(authRequestInterceptor(getAccessToken), (error) =>
      Promise.reject(error)
    )

    axiosPrivateInstance.interceptors.response.use(
      (response) => response,
      authResponseErrorInterceptor(refreshToken, logout)
    )
  }

  return axiosPrivateInstance
}

export function useApi() {
  return axiosInstance
}

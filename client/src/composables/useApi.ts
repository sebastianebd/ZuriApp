import { axiosInstance, axiosPrivateInstance } from '../config/axios'
import type { AxiosInstance } from 'axios'

export let interceptorsInitialized = false

export function resetInterceptors() {
  interceptorsInitialized = false
}

let getAccessTokenFn = () => ''
let refreshTokenFn = async () => ''
let logoutFn = async () => {}

export function injectAuthCallbacks(
  getAuthToken: () => string,
  refresh: () => Promise<string>,
  logout: () => Promise<void>
) {
  getAccessTokenFn = getAuthToken
  refreshTokenFn = refresh
  logoutFn = logout
}

export function setupAxiosInterceptors() {
  if (interceptorsInitialized) return
  interceptorsInitialized = true

  axiosPrivateInstance.interceptors.request.use(async (config) => {
    const token = getAccessTokenFn()
    
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  }, (error) => Promise.reject(error))

  axiosPrivateInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const prevRequest = error?.config

      if ((error?.response?.status === 401 || error?.response?.status === 403) && !prevRequest.sent) {
        prevRequest.sent = true
        try {
          const newAccessToken = await refreshTokenFn()
          prevRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
          return axiosPrivateInstance(prevRequest)
        } catch (refreshError) {
          console.error('Auto-logout failed, forcing redirect', refreshError)
          await logoutFn()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }
      return Promise.reject(error)
    }
  )
}

export function useApiPrivate(): AxiosInstance {
  return axiosPrivateInstance
}

export function useApi() {
  return axiosInstance
}

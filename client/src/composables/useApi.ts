import { axiosInstance, axiosPrivateInstance } from '../config/axios'
import type { AxiosInstance } from 'axios'

let interceptorsInitialized = false

export function useApiPrivate(
  getAccessToken: () => string,
  refreshToken: () => Promise<string>,
  logout: () => Promise<void>
): AxiosInstance {
  if (!interceptorsInitialized) {
    interceptorsInitialized = true

    axiosPrivateInstance.interceptors.request.use(
      (config) => {
        const token = getAccessToken()
        if (token && !config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    axiosPrivateInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error?.config

        if (
          (error?.response?.status === 401 || error?.response?.status === 403) &&
          !prevRequest.sent
        ) {
          prevRequest.sent = true
          console.log('Token expirado, intentando renovarlo...')

          try {
            const newAccessToken = await refreshToken()
            console.log('newAccessToken', newAccessToken)
            prevRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
            return axiosPrivateInstance(prevRequest)
          } catch (refreshError) {
            await logout()
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  return axiosPrivateInstance
}

export function useApi() {
  return axiosInstance
}

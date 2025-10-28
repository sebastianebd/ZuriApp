import { axiosInstance, axiosPrivateInstance } from '../config/axios'
import type { AxiosInstance } from 'axios'

let interceptorsInitialized = false

export function useApiPrivate(
  getAccessToken: () => string,
  refreshToken: () => Promise<string>
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

          try {
            const newAccessToken = await refreshToken()
            prevRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
            return axiosPrivateInstance(prevRequest)
          } catch (refreshError) {
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

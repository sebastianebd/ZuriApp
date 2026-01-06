import { defineStore } from 'pinia'
import * as AuthService from '../services/auth.service'
import { useApiPrivate } from '../composables/useApi'
import type { State, LoginData } from '../types/models'
import type { AxiosInstance } from 'axios'

let privateApiInstance: AxiosInstance | null = null

export const useAuthStore = defineStore('auth', {
  state: (): State => ({
    user: null,
    accessToken: '',
    authReady: false
  }),

  getters: {
    userDetail: (state) => state.user,
    isAuthenticated: (state) => !!state.accessToken
  },

  actions: {
    getAccessToken() {
      return this.accessToken
    },

    async refreshToken() {
      const data = await AuthService.refresh()
      this.accessToken = data.access_token
      return data.access_token
    },

    usePrivateApi(): AxiosInstance {
      if (!privateApiInstance) {
        privateApiInstance = useApiPrivate(
          () => this.getAccessToken(),
          () => this.refreshToken(),
          () => this.logout()
        )
      }
      return privateApiInstance
    },

    async login(payload: LoginData) {
      const data = await AuthService.login(payload)
      this.accessToken = data.access_token
      await this.getUser()
      this.authReady = true
      return data
    },

    async getUser() {
      const apiPrivate = this.usePrivateApi()
      const data = await AuthService.getUser(apiPrivate)
      this.user = data
      return data
    },

    async changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
      try {
        const privateApi = this.usePrivateApi()
        const { data } = await privateApi.post('/auth/change-password', {
          currentPassword,
          newPassword,
          confirmPassword
        })
        return { success: true, message: data.mensaje }
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.mensaje || 'Error al cambiar la contraseña'
        }
      }
    },

    async logout() {
      try {
        const apiPrivate = this.usePrivateApi()
        await AuthService.logout(apiPrivate)
      } catch (error) {
        console.error('Logout API failed, forcing local cleanup', error)
      } finally {
        this.accessToken = ''
        this.user = null
        sessionStorage.clear()
        localStorage.clear() // Safety cleanup for migrated users
        // window.location.reload() // Optional aggressive cleanup
      }
    },

    async fetchLoginHistory() {
      const privateApi = this.usePrivateApi()
      const { data } = await privateApi.get('/auth/history')
      return data
    }
  },

  persist: {
    key: 'auth',
    storage: sessionStorage
  }
})

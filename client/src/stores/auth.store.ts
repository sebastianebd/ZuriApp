import { defineStore } from 'pinia'
import * as AuthService from '../services/auth.service'
import { useApiPrivate } from '../composables/useApi'
import { type AuthState, type LoginData } from '../types/auth.types'
import type { AxiosInstance } from 'axios'
import socket from '../plugins/socket'

let privateApiInstance: AxiosInstance | null = null

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
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

      // Connect Socket with User ID
      if (this.user && this.user._id) {
        if (socket.connected) socket.disconnect() // Reset connection to apply new auth
        socket.auth = { userId: this.user._id }
        socket.connect()
      }

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
        socket.disconnect() // Disconnect socket
        sessionStorage.clear()
        localStorage.clear() // Safety cleanup for migrated users
        // window.location.reload() // Optional aggressive cleanup
      }
    },

    async fetchLoginHistory() {
      const privateApi = this.usePrivateApi()
      const { data } = await privateApi.get('/auth/history')
      return data
    },

    /**
     * Verifica si el usuario tiene un permiso específico o es SuperAdmin (Nivel 100)
     */
    hasPermission(permission: string): boolean {
      if (!this.user) return false

      // Super Admin Override
      if (this.user.nivel === 100) return true

      // Check permissions array
      if (this.user.permisos && this.user.permisos.includes(permission)) {
        return true
      }

      return false
    },

    bindSocketEvents() {
      // Avoid duplicate binding
      if (socket.hasListeners('cargo_updated')) return

      socket.on('cargo_updated', async (data: { cargoNombre: string; action: string }) => {
        // If the updated cargo matches current user's cargo, refresh permissions
        if (this.user && this.user.tipo_cargo === data.cargoNombre) {
          console.log(
            `[AuthStore] Cargo '${data.cargoNombre}' updated. Refreshing user permissions...`
          )
          await this.getUser()
        }
      })
    }
  },

  persist: {
    key: 'auth',
    storage: sessionStorage
  }
})

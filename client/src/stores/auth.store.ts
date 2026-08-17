import { defineStore } from 'pinia'
import * as AuthService from '../services/auth.service'
import { useApiPrivate } from '../composables/useApi'
import { type AuthState, type LoginData } from '../types/auth.types'
import type { AxiosInstance } from 'axios'
import socket from '../plugins/socket'


export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    IStaff: null,
    accessToken: '',
    authReady: false
  }),

  getters: {
    userDetail: (state) => state.IStaff,
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
      return useApiPrivate()
    },

    async login(payload: LoginData) {
      const data = await AuthService.login(payload)
      this.accessToken = data.access_token
      await this.getUser()
      this.authReady = true

      // Connect Socket with Token
      if (this.accessToken) {
        if (socket.connected) socket.disconnect() // Reset connection to apply new auth
        socket.auth = { token: this.accessToken }
        socket.connect()
      }

      return data
    },

    async getUser() {
      const apiPrivate = this.usePrivateApi()
      const data = await AuthService.getUser(apiPrivate)
      this.IStaff = data
      return data
    },

    async changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
      try {
        const apiPrivate = this.usePrivateApi()
        const data = await AuthService.changePassword(apiPrivate, {
          currentPassword,
          newPassword,
          confirmPassword
        })
        return { success: true, message: data.message || 'Contraseña actualizada exitosamente' }
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'Error al cambiar la contraseña'
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
        this.IStaff = null
        socket.disconnect() // Disconnect socket
        sessionStorage.clear()
        localStorage.clear() // Safety cleanup for migrated users
        // window.location.reload() // Optional aggressive cleanup
      }
    },

    async fetchLoginHistory() {
      const apiPrivate = this.usePrivateApi()
      const data = await AuthService.getLoginHistory(apiPrivate)
      return data
    },

    hasPermission(permission: string): boolean {
      if (!this.IStaff || !this.IStaff.role) return false
      const perms = this.IStaff.role.permissions || []
      if (perms.includes('*')) return true
      return perms.includes(permission)
    },

    /**
     * Verifica si el usuario actual tiene jurisdicción sobre un nivel objetivo
     */
    canManageUser(targetLevel: number): boolean {
      const myLevel = this.IStaff?.role?.level || 0
      return myLevel > targetLevel || myLevel >= 100
    },

    bindSocketEvents() {
      // Avoid duplicate binding
      if (socket.hasListeners('cargo_updated')) return

      socket.on('cargo_updated', async (data: { cargoNombre: string; action: string }) => {
        // If the updated cargo matches current IStaff's cargo, refresh permissions
        if (this.IStaff?.role?.code === data.cargoNombre) {
          console.log(
            `[AuthStore] Cargo '${data.cargoNombre}' updated. Refreshing IStaff permissions...`
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

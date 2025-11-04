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

    async logout() {
      const apiPrivate = this.usePrivateApi()
      const data = await AuthService.logout(apiPrivate)
      this.accessToken = ''
      this.user = null
      return data
    },

  },

  persist: {
    key: 'auth',
    storage: sessionStorage
  }
})

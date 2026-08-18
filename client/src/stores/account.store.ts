import { defineStore } from 'pinia'
import * as AccountService from '../services/account.service'
import { useAuthStore } from './auth.store'
import type { AxiosInstance } from 'axios'
import type { IAccount } from '../types/account.types'

export const useAccountStore = defineStore('account', {
  state: () => ({
    accounts: [] as IAccount[],
    stale: false,
  }),
  actions: {
    invalidateAccounts() {
      // Mark state as stale so that next time accounts are needed, they are fetched again
      this.stale = true
    },
    async sendResetLink(staffId: string) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      try {
        await AccountService.sendResetLink(apiPrivate, staffId)
      } catch (error) {
        console.error('Error al enviar link de reset:', error)
        throw error
      }
    },
    async toggleAccountAccess(staffId: string, isActive: boolean) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      try {
        const res = await apiPrivate.patch(`/accounts/${staffId}/toggle-status`, { isActive })
        return res.data
      } catch (error) {
        console.error('Error al cambiar estado de cuenta:', error)
        throw error
      }
    },
    async fetchAccountStatus(staffId: string) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      try {
        const res = await apiPrivate.get(`/accounts/${staffId}/status`)
        return res.data
      } catch (error) {
        console.error('Error al obtener estado de cuenta:', error)
        throw error
      }
    }
  }
})

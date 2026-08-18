import { defineStore } from 'pinia'
import * as StaffService from '../services/staff.service'
import { useAuthStore } from './auth.store'
import { useAccountStore } from './account.store'
import { type StaffRegistration, type IStaff } from '../types/staff.types'
import type { AxiosInstance } from 'axios'

export const useStaffStore = defineStore('staff', {
  state: () => ({
    staffMembers: [] as IStaff[], // Legacy: for backward compatibility
    currentPageStaff: [] as IStaff[], // New: only current page
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    },
    // 🏢 ENTERPRISE: Search state for modal IStaff selection
    searchResults: [] as IStaff[],
    searchPagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 20
    },
    isSearching: false
  }),
  actions: {
    async fetchPaginated(params: {
      page: number
      limit: number
      search?: string
      positionId?: string
      isActive?: boolean
      rut?: string
    }) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      try {
        const data = await StaffService.getAllStaff(apiPrivate, params)

        // Update state with paginated data
        this.currentPageStaff = data.staff
        this.pagination = data.pagination

        return data
      } catch (error) {
        console.error('Error al cargar personal paginado:', error)
        throw error
      }
    },

    async deleteStaff(id: string) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      try {
        await StaffService.deleteStaff(apiPrivate, id)
        // Optimistic update
        this.staffMembers = this.staffMembers.filter((u) => u._id !== id)
      } catch (error) {
        console.error('Error al eliminar personal:', error)
        throw error
      }
    },

    async updateStaff(id: string, payload: Partial<StaffRegistration>) {
      const authStore = useAuthStore()
      const accountStore = useAccountStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      try {
        await StaffService.updateStaff(apiPrivate, id, payload)
        // Force account invalidation just in case role promotion happened
        accountStore.invalidateAccounts()
      } catch (error) {
        console.error('Error al actualizar personal:', error)
        throw error
      }
    },

    async createStaff(payload: StaffRegistration) {
      const authStore = useAuthStore()
      const accountStore = useAccountStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      try {
        const data = await StaffService.createStaff(apiPrivate, payload)
        // Force account invalidation if a new account was generated
        accountStore.invalidateAccounts()
        return data
      } catch (error) {
        console.error('Error al crear personal:', error)
        throw error
      }
    },

    // 🏢 ENTERPRISE: Server-side search for scalable IStaff selection (1500+ users)
    async searchStaff(params: { search: string; page?: number; limit?: number }) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()

      this.isSearching = true

      try {
        const data = await StaffService.getAllStaff(apiPrivate, params)

        if (data && typeof data === 'object' && 'staff' in data) {
          this.searchResults = data.staff || []
          this.searchPagination = {
            currentPage: data.pagination?.currentPage || 1,
            totalPages: data.pagination?.totalPages || 1,
            totalItems: data.pagination?.totalItems || 0,
            itemsPerPage: data.pagination?.itemsPerPage || 20
          }
        }
        return this.searchResults
      } catch (error) {
        console.error('Error searching staff:', error)
        this.searchResults = []
        throw error
      } finally {
        this.isSearching = false
      }
    }
  }
})

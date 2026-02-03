import { defineStore } from 'pinia'
import type { ICargo } from '@/types/models'
import { useAuthStore } from './auth.store'

interface ICargoState {
  cargos: ICargo[]
  loading: boolean
  error: string | null
}

export const useCargoStore = defineStore('cargo', {
  state: (): ICargoState => ({
    cargos: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchCargos(forceRefresh = false) {
      if (this.cargos.length > 0 && !forceRefresh) return

      this.loading = true
      this.error = null
      const authStore = useAuthStore()
      const api = authStore.usePrivateApi()

      try {
        const response = await api.get<ICargo[]>('/cargos')
        // Check if response.data is the array or response itself
        this.cargos = response.data
      } catch (err: any) {
        console.error('Error fetching cargos:', err)
        this.error = err.message || 'Error al cargar cargos'
      } finally {
        this.loading = false
      }
    },

    async createCargo(cargoData: Partial<ICargo>) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()
      const api = authStore.usePrivateApi()

      try {
        const response = await api.post<ICargo>('/cargos', cargoData)
        this.cargos.push(response.data)
        return response.data
      } catch (err: any) {
        console.error('Error creating cargo:', err)
        this.error = err.message || 'Error al crear cargo'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateCargo(id: string, cargoData: Partial<ICargo>) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()
      const api = authStore.usePrivateApi()

      try {
        const response = await api.put<ICargo>(`/cargos/${id}`, cargoData)
        const updated = response.data
        const index = this.cargos.findIndex((c) => c._id === id)
        if (index !== -1) {
          this.cargos[index] = updated
        }
        return updated
      } catch (err: any) {
        console.error('Error updating cargo:', err)
        this.error = err.message || 'Error al actualizar cargo'
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteCargo(id: string) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()
      const api = authStore.usePrivateApi()

      try {
        // Assuming soft delete just updates the cargo to inactive, but the API endpoint is DELETE
        // The backend implementation of deleteCargo does findByIdAndUpdate(id, { activo: false }) and returns { message, cargo }
        await api.delete<ICargo>(`/cargos/${id}`)
        // Update local state (mark as inactive or remove?)
        // Since it's soft delete, let's update it in the list if we show inactive ones, or remove it.
        // Usually lists filter only active ones unless "show all" is toggled.
        // For now, let's remove from local list to reflect instant disappearance.
        this.cargos = this.cargos.filter((c) => c._id !== id)
      } catch (err: any) {
        console.error('Error deleting cargo:', err)
        this.error = err.message || 'Error al eliminar cargo'
        throw err
      } finally {
        this.loading = false
      }
    }
  }
})

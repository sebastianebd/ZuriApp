import { defineStore } from 'pinia'
import { useAuthStore } from './auth.store'

export interface Position {
  _id: string
  name: string
  position_code: string
  description?: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface IPositionState {
  positions: Position[]
  loading: boolean
  error: string | null
}

export const usePositionStore = defineStore('position', {
  state: (): IPositionState => ({
    positions: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchPositions(forceRefresh = false) {
      if (this.positions.length > 0 && !forceRefresh) return

      this.loading = true
      this.error = null
      const authStore = useAuthStore()
      const api = authStore.usePrivateApi()

      try {
        const response = await api.get<Position[]>('/positions')
        this.positions = response.data
      } catch (err: any) {
        console.error('Error fetching positions:', err)
        this.error = err.message || 'Error al cargar posiciones'
      } finally {
        this.loading = false
      }
    },

    async createPosition(positionData: Partial<Position>) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()
      const api = authStore.usePrivateApi()

      try {
        const response = await api.post<Position>('/positions', positionData)
        this.positions.push(response.data)
        return response.data
      } catch (err: any) {
        console.error('Error creating position:', err)
        this.error = err.response?.data?.error || err.message || 'Error al crear posicion'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updatePosition(id: string, positionData: Partial<Position>) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()
      const api = authStore.usePrivateApi()

      try {
        const response = await api.put<Position>(`/positions/${id}`, positionData)
        const updated = response.data
        const index = this.positions.findIndex((p) => p._id === id)
        if (index !== -1) {
          this.positions[index] = updated
        }
        return updated
      } catch (err: any) {
        console.error('Error updating position:', err)
        this.error = err.response?.data?.error || err.message || 'Error al actualizar posicion'
        throw err
      } finally {
        this.loading = false
      }
    },

    async deletePosition(id: string) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()
      const api = authStore.usePrivateApi()

      try {
        await api.delete<Position>(`/positions/${id}`)
        this.positions = this.positions.filter((p) => p._id !== id)
      } catch (err: any) {
        console.error('Error deleting position:', err)
        this.error = err.response?.data?.error || err.message || 'Error al eliminar posicion'
        throw err
      } finally {
        this.loading = false
      }
    }
  }
})

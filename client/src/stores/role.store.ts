import { defineStore } from 'pinia'
import { useAuthStore } from './auth.store'

export interface Role {
  _id: string
  name: string
  code: string
  level: number
  permissions: string[]
  hasSystemAccess: boolean
  description?: string
  createdAt?: Date
  updatedAt?: Date
}

interface IRoleState {
  roles: Role[]
  loading: boolean
  error: string | null
}

export const useRoleStore = defineStore('role', {
  state: (): IRoleState => ({
    roles: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchRoles(forceRefresh = false) {
      if (this.roles.length > 0 && !forceRefresh) return

      this.loading = true
      this.error = null
      const authStore = useAuthStore()
      const api = authStore.usePrivateApi()

      try {
        const response = await api.get<Role[]>('/roles')
        this.roles = response.data
      } catch (err: any) {
        console.error('Error fetching roles:', err)
        this.error = err.message || 'Error al cargar roles'
      } finally {
        this.loading = false
      }
    },

    async createRole(roleData: Partial<Role>) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()
      const api = authStore.usePrivateApi()

      try {
        const response = await api.post<Role>('/roles', roleData)
        this.roles.push(response.data)
        return response.data
      } catch (err: any) {
        console.error('Error creating role:', err)
        this.error = err.response?.data?.error || err.message || 'Error al crear rol'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateRole(id: string, roleData: Partial<Role>) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()
      const api = authStore.usePrivateApi()

      try {
        const response = await api.put<Role>(`/roles/${id}`, roleData)
        const updated = response.data
        const index = this.roles.findIndex((r) => r._id === id)
        if (index !== -1) {
          this.roles[index] = updated
        }
        return updated
      } catch (err: any) {
        console.error('Error updating role:', err)
        this.error = err.response?.data?.error || err.message || 'Error al actualizar rol'
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteRole(id: string) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()
      const api = authStore.usePrivateApi()

      try {
        await api.delete<Role>(`/roles/${id}`)
        this.roles = this.roles.filter((r) => r._id !== id)
      } catch (err: any) {
        console.error('Error deleting role:', err)
        this.error = err.response?.data?.error || err.message || 'Error al eliminar rol'
        throw err
      } finally {
        this.loading = false
      }
    }
  }
})

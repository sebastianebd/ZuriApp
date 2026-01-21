import { defineStore } from 'pinia'
import * as UserService from '../services/user.service'
import { useAuthStore } from './auth.store'
import type { registrarUsuario, User } from '../types/models'
import type { AxiosInstance } from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [] as any[], // Legacy: for backward compatibility
    currentPageUsers: [] as any[], // New: only current page
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    },
    // 🏢 ENTERPRISE: Search state for modal user selection
    searchResults: [] as any[],
    searchPagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 20
    },
    isSearching: false
  }),
  actions: {
    async mostrarUsersCargoTens() {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      try {
        const data = await UserService.mostrarUsersCargoTens(apiPrivate)
        return data
      } catch (error) {
        console.error('Error al cargar usuarios TENS:', error)
        throw error
      }
    },

    async mostrarTodos(limit?: number) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      try {
        const data = await UserService.mostrarTodosUsuarios(apiPrivate, undefined, limit)
        // Normalize response: handle both array and paginated object
        let usersArray: User[] = []
        if (Array.isArray(data)) {
          usersArray = data
        } else if (data && typeof data === 'object' && 'usuarios' in data) {
          usersArray = (data as any).usuarios
        }

        this.users = usersArray // Store in state (legacy)
        return usersArray
      } catch (error) {
        console.error('Error al cargar usuarios:', error)
        throw error
      }
    },

    // New: Server-Side Pagination
    async fetchPaginated(params: { page: number; limit: number; search?: string; cargo?: string }) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      try {
        const { data } = await apiPrivate.get('/users/', { params })

        // Update state with paginated data
        this.currentPageUsers = data.usuarios
        this.pagination = data.pagination

        return data
      } catch (error) {
        console.error('Error al cargar usuarios paginados:', error)
        throw error
      }
    },

    // New Action for Remote Search (Does not mutate global state unless needed)
    async buscarUsuarios(search: string) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      try {
        const data = await UserService.mostrarTodosUsuarios(apiPrivate, search)
        return data
      } catch (error) {
        console.error('Error al buscar usuarios:', error)
        return []
      }
    },

    async eliminarUsuario(id: string) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      try {
        await UserService.eliminarUsuario(apiPrivate, id)
        // Optimistic update or refetch
        this.users = this.users.filter((u) => u._id !== id)
      } catch (error) {
        console.error('Error al eliminar usuario:', error)
        throw error
      }
    },

    async actualizarUsuario(id: string, datosActualizados: any) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      try {
        await UserService.actualizarUsuario(apiPrivate, id, datosActualizados)
        // Refresh list
        await this.mostrarTodos()
      } catch (error) {
        console.error('Error al actualizar usuario:', error)
        throw error
      }
    },

    async crearUsuario(usuario: registrarUsuario) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      try {
        const data = await UserService.crearUsuario(apiPrivate, usuario)
        await this.mostrarTodos() // Refresh list to include new user
        return data
      } catch (error) {
        console.error('Error al crear usuario:', error)
        throw error
      }
    },

    // 🏢 ENTERPRISE: Server-side search for scalable user selection (1500+ users)
    async searchUsers(params: { search: string; page?: number; limit?: number }) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()

      this.isSearching = true

      try {
        const data = await UserService.searchUsers(apiPrivate, params)

        // Normalize response: handle both array and paginated object
        if (data && typeof data === 'object' && 'usuarios' in data) {
          this.searchResults = data.usuarios || []
          this.searchPagination = {
            currentPage: data.pagination?.currentPage || 1,
            totalPages: data.pagination?.totalPages || 1,
            totalItems: data.pagination?.totalItems || 0,
            itemsPerPage: data.pagination?.itemsPerPage || 20
          }
        } else if (Array.isArray(data)) {
          this.searchResults = data
          this.searchPagination = {
            currentPage: 1,
            totalPages: 1,
            totalItems: data.length,
            itemsPerPage: data.length
          }
        }

        return this.searchResults
      } catch (error) {
        console.error('Error searching users:', error)
        this.searchResults = []
        throw error
      } finally {
        this.isSearching = false
      }
    }
  }
})

import { defineStore } from 'pinia'
import * as UserService from '../services/user.service'
import { useAuthStore } from './auth.store'
import type { registrarUsuario } from '../types/models'
import type { AxiosInstance } from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [] as any[] // Define strict type if possible, using any for now to match file style
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

    async mostrarTodos() {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      try {
        const data = await UserService.mostrarTodosUsuarios(apiPrivate)
        this.users = data // Store in state
        return data
      } catch (error) {
        console.error('Error al cargar usuarios:', error)
        throw error
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
    }
  }
})

import { defineStore } from 'pinia'
import * as UserService from '../services/user.service'
import { useAuthStore } from './auth.store'
import type { registrarUsuario } from '../types/models'
import type { AxiosInstance } from 'axios'

export const useUserStore = defineStore('user', {
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
        return data
      } catch (error) {
        console.error('Error al crear usuario:', error)
        throw error
      }
    }
  }
})

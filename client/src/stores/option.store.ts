import { defineStore } from 'pinia'
import * as OptionService from '../services/option.service'
import { useAuthStore } from './auth.store'

export const useOptionStore = defineStore('option', {
  state: () => ({
    opciones: null as any | null
  }),
  actions: {
    async mostrarOpciones(forceRefresh = false) {
      if (this.opciones && !forceRefresh) {
        return this.opciones
      }
      const authStore = useAuthStore()
      const apiPrivate = authStore.usePrivateApi()
      const data = await OptionService.mostrarOpciones(apiPrivate)
      this.opciones = data
      return data
    }
  }
})

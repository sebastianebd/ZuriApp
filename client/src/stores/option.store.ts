import { defineStore } from 'pinia'
import * as OptionService from '../services/option.service'
import { useAuthStore } from './auth.store'
import type { IOptionsState } from '@/types/models'

export const useOptionStore = defineStore('option', {
  state: () => ({
    opciones: null as IOptionsState | null
  }),
  actions: {
    async mostrarOpciones(forceRefresh = false): Promise<IOptionsState> {
      if (this.opciones && !forceRefresh) {
        return this.opciones
      }
      const authStore = useAuthStore()
      const apiPrivate = authStore.usePrivateApi()
      const data = await OptionService.mostrarOpciones(apiPrivate)
      this.opciones = data as unknown as IOptionsState // Casting response to strict type
      return this.opciones
    }
  }
})

import { defineStore } from 'pinia'
import * as OptionService from '../services/option.service'
import { useAuthStore } from './auth.store'
import { type OptionsState } from '@/types/common.types'

export const useOptionStore = defineStore('option', {
  state: () => ({
    opciones: null as OptionsState | null
  }),
  actions: {
    async mostrarOpciones(forceRefresh = false): Promise<OptionsState> {
      if (this.opciones && !forceRefresh) {
        return this.opciones
      }
      const authStore = useAuthStore()
      const apiPrivate = authStore.usePrivateApi()
      const data = await OptionService.mostrarOpciones(apiPrivate)
      this.opciones = data as unknown as OptionsState // Casting response to strict type
      return this.opciones
    }
  }
})

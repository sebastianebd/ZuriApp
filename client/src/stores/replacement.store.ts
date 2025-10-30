
import { defineStore } from 'pinia'
import * as ReplacementService from '../services/replacement.service'
import { useAuthStore } from './auth.store'
import type { RegisterDataReemplazo } from '@/types/models'
import type { AxiosInstance } from 'axios'

export const useReplacementStore = defineStore('replacement', {
  state: () => ({
    reemplazosActivos: [] as RegisterDataReemplazo[],
    cargando: false as boolean,
    error: null as string | null,

    // 🆕 ESTADO DE LOS FILTROS
    filtroRutSaliente: '' as string,
    filtroRutEntrante: '' as string,
    filtroServicio: '' as string,
    fechaInicio: '' as string,
    fechaFin: '' as string
  }),

  // 🔎 GETTERS
  getters: {
    totalReemplazos: (state) => state.reemplazosActivos.length,
    hayReemplazos: (state) => state.reemplazosActivos.length > 0,

    // 🆕 GETTER: Lógica de filtrado centralizada (la 'fuente de verdad' para la tabla)
    reemplazosFiltrados(state) {
      let filtrados = state.reemplazosActivos

      // 1. Filtro por Fechas
      if (state.fechaInicio) {
        filtrados = filtrados.filter((r) => String(r.fecha_inicio) >= state.fechaInicio);
      }
      if (state.fechaFin) {
        filtrados = filtrados.filter((r) => String(r.fecha_termino) <= state.fechaFin)
      }

      // 2. Filtro por RUT Saliente
      if (state.filtroRutSaliente) {
        filtrados = filtrados.filter((r) => r.rut_saliente.startsWith(state.filtroRutSaliente))
      }

      // 3. Filtro por RUT Entrante (se aplica simultáneamente con el Saliente)
      if (state.filtroRutEntrante) {
        filtrados = filtrados.filter((r) => r.rut_entrante.startsWith(state.filtroRutEntrante))
      }

      // 4. Filtro por Servicio
      if (state.filtroServicio) {
        filtrados = filtrados.filter((r) => r.servicio === state.filtroServicio)
      }

      return filtrados
    }
  },

  // 🚀 ACTIONS
  actions: {
    async mostrarReemplazos() {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      this.cargando = true
      this.error = null

      try {
        const data = await ReplacementService.mostrarReemplazos(apiPrivate)

        // Asegurarse de que las fechas sean tratadas como strings (si es el formato de la API)
        this.reemplazosActivos = data.map((r: RegisterDataReemplazo) => ({
          ...r,
          fecha_inicio: String(r.fecha_inicio).slice(0, 10),
          fecha_termino: String(r.fecha_termino).slice(0, 10)
        }))

        return data
      } catch (error: any) {
        console.error('Error al mostrar reemplazos:', error)
        this.error = 'No se pudieron cargar los reemplazos.'
        throw error
      } finally {
        this.cargando = false
      }
    },

    // 🆕 ACCIÓN: ELIMINAR REGISTRO
    async eliminarReemplazo(reemplazoId: string) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()

      try {
        await ReplacementService.eliminarReemplazo(apiPrivate, reemplazoId)

        // 💡 Sincronización de estado: Eliminar del array local
        this.reemplazosActivos = this.reemplazosActivos.filter((r) => r._id !== reemplazoId)

        // 🚀 Aquí podrías añadir un mensaje de éxito
      } catch (error) {
        console.error('Error al eliminar reemplazo:', error)
        this.error = 'No se pudo eliminar el reemplazo.'
        throw error
      }
    },

    // 🆕 ACCIÓN: ACTUALIZAR REGISTRO
    async actualizarReemplazo(reemplazoId: string, datosActualizados: any) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()

      try {
        const reemplazoModificado = await ReplacementService.actualizarReemplazo(
          apiPrivate,
          reemplazoId,
          datosActualizados
        )

        // 💡 Sincronización de estado: Encontrar y reemplazar el registro
        const index = this.reemplazosActivos.findIndex((r) => r._id === reemplazoId)

        if (index !== -1) {
          // Aseguramos que los datos se actualicen correctamente
          this.reemplazosActivos[index] = {
            ...this.reemplazosActivos[index],
            ...reemplazoModificado
          }
        }
        // Si la API devuelve el objeto con las fechas cortadas, podemos forzarlo aquí para consistencia:
        // this.reemplazosActivos[index].fecha_inicio = String(reemplazoModificado.fecha_inicio).slice(0, 10);

        // 🚀 Aquí podrías añadir un mensaje de éxito
      } catch (error) {
        console.error('Error al actualizar reemplazo:', error)
        this.error = 'No se pudo actualizar el reemplazo.'
        throw error
      }
    },

    // 🆕 ACCIÓN: LIMPIAR FILTROS
    limpiarFiltros() {
      this.filtroRutSaliente = ''
      this.filtroRutEntrante = ''
      this.filtroServicio = ''
      this.fechaInicio = ''
      this.fechaFin = ''
      // El getter 'reemplazosFiltrados' se recalcula automáticamente
    },

    limpiarReemplazos() {
      this.reemplazosActivos = []
      this.error = null
      this.limpiarFiltros() // Limpiamos también los filtros al limpiar los datos
    }
  },

  persist: {
    key: 'replacement',
    storage: sessionStorage
  }
})

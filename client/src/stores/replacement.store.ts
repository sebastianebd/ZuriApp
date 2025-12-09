import { defineStore } from 'pinia'
import * as ReplacementService from '../services/replacement.service'
import { useAuthStore } from './auth.store'
import type { RegisterDataReemplazo, SustitucionPayload } from '@/types/models'
import type { AxiosInstance } from 'axios'
import { getDatesInRange } from '@/utils/date-utils'

export const useReplacementStore = defineStore('replacement', {
  state: () => ({
    reemplazosActivos: [] as RegisterDataReemplazo[],
    cargando: false as boolean,
    error: null as string | null,

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
    getFechasOcupadas:
      (state) =>
      (funcionarioId: string): string[] => {
        const fechasOcupadasSet = new Set<string>()

        // 1. Filtrar los reemplazos donde este funcionario es el SALIENTE
        const reemplazosDelFuncionario = state.reemplazosActivos.filter(
          (r) => r.id_entrante === funcionarioId
        )

        // 2. Expandir los rangos de fechas de cada reemplazo a días individuales
        reemplazosDelFuncionario.forEach((r) => {
          const fechasRango = getDatesInRange(r.fecha_inicio, r.fecha_termino)
          fechasRango.forEach((fecha) => fechasOcupadasSet.add(fecha))
        })

        // 3. Devolver la lista única de fechas ocupadas
        return Array.from(fechasOcupadasSet)
      },

    reemplazosFiltrados(state) {
      let filtrados = state.reemplazosActivos

      if (state.fechaInicio) {
        filtrados = filtrados.filter((r) => String(r.fecha_inicio) === state.fechaInicio)
      }
      if (state.fechaFin) {
        filtrados = filtrados.filter((r) => String(r.fecha_termino) === state.fechaFin)
      }

      if (state.filtroRutSaliente) {
        filtrados = filtrados.filter((r) => r.rut_saliente.startsWith(state.filtroRutSaliente))
      }

      if (state.filtroRutEntrante) {
        filtrados = filtrados.filter((r) => r.rut_entrante.startsWith(state.filtroRutEntrante))
      }

      if (state.filtroServicio) {
        filtrados = filtrados.filter((r) => r.servicio === state.filtroServicio)
      }

      return filtrados
    }
  },

  actions: {
    async mostrarReemplazos() {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      this.cargando = true
      this.error = null

      try {
        const data = await ReplacementService.mostrarReemplazos(apiPrivate)

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


    //ESTA FUNCION ES PARA FINALIZAR (ANTICIPADAMENTE) REEMPLAZO NO ELIMINAR
    async finalizarReemplazo(reemplazoId: string) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()

      try {
        await ReplacementService.finalizarReemplazo(apiPrivate, reemplazoId)
        await this.mostrarReemplazos()

        this.reemplazosActivos = this.reemplazosActivos.filter((r) => r._id !== reemplazoId)
      } catch (error) {
        console.error('Error al finalizar reemplazo:', error)
        this.error = 'No se pudo finalizar el reemplazo.'
        throw error
      }
    },

      //ESTA FUNCION ES PARA ANULAR REEMPLAZO (FUTURO, AUN NO EN CURSO) NO ELIMINAR
    async anularReemplazo(reemplazoId: string) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()

      try {
        await ReplacementService.anularReemplazo(apiPrivate, reemplazoId)
        await this.mostrarReemplazos()

        this.reemplazosActivos = this.reemplazosActivos.filter((r) => r._id !== reemplazoId)
      } catch (error) {
        console.error('Error al anular reemplazo:', error)
        this.error = 'No se pudo anular el reemplazo.'
        throw error
      }
    },

    async mostrarHistorialUsuario(id: string) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()

      try {
        const data = await ReplacementService.mostrarHistorialUsuario(apiPrivate, id)
        return data
      } catch (error: any) {
        console.error('Error al mostrar reemplazos:', error)
        this.error = 'No se pudieron cargar los reemplazos.'
        throw error
      }
    },

    async crearReemplazo(reemplazo: RegisterDataReemplazo) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()

      try {
        await ReplacementService.crearReemplazo(reemplazo, apiPrivate)
        await this.mostrarReemplazos()
      } catch (error) {
        console.error('Error al crear reemplazo:', error)
        this.error = 'No se pudo crear el reemplazo.'
        throw error
      }
    },

    async actualizarReemplazo(reemplazoId: string, datosActualizados: any) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()

      try {
        await ReplacementService.actualizarReemplazo(
          apiPrivate,
          reemplazoId,
          datosActualizados
        )
        await this.mostrarReemplazos()

      } catch (error) {
        console.error('Error al actualizar reemplazo:', error)
        this.error = 'No se pudo actualizar el reemplazo.'
        throw error
      }
    },

    async procesarSustitucion(payload: SustitucionPayload) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()

      try {
        await ReplacementService.procesarSustitucion(apiPrivate, payload)

        // CRUCIAL: Refrescar los datos para ver el registro A modificado y el nuevo registro B
        await this.mostrarReemplazos()
      } catch (error) {
        console.error('Error al procesar la sustitución:', error)
        this.error = 'No se pudo completar la sustitución.'
        throw error
      }
    },

    limpiarFiltros() {
      this.filtroRutSaliente = ''
      this.filtroRutEntrante = ''
      this.filtroServicio = ''
      this.fechaInicio = ''
      this.fechaFin = ''
    },

    limpiarReemplazos() {
      this.reemplazosActivos = []
      this.error = null
      this.limpiarFiltros()
    }
  },

  persist: {
    key: 'replacement',
    storage: sessionStorage
  }
})

import { defineStore } from 'pinia'
import * as ReplacementService from '../services/replacement.service'
import { useAuthStore } from './auth.store'
import type { RegisterDataReemplazo, SustitucionPayload } from '@/types/models'
import type { AxiosInstance } from 'axios'
import { getDatesInRange } from '@/utils/date-utils'

export const useReplacementStore = defineStore('replacement', {
  state: () => ({
    // Server-side pagination: only store current page
    currentPageReplacements: [] as RegisterDataReemplazo[],

    // Pagination metadata
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,

    // Legacy: Keep for backward compatibility
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
    // Use current page replacements for display
    activeReplacements: (state) => state.currentPageReplacements,

    totalReemplazos: (state) => state.totalItems,
    hayReemplazos: (state) => state.currentPageReplacements.length > 0,

    // Pagination info
    paginationInfo: (state) => ({
      currentPage: state.currentPage,
      totalPages: state.totalPages,
      totalItems: state.totalItems,
      itemsPerPage: state.itemsPerPage
    }),

    getFechasOcupadas:
      (state) =>
      (funcionarioId: string): string[] => {
        const fechasOcupadasSet = new Set<string>()

        // 1. Filtrar los reemplazos donde este funcionario es el SALIENTE
        const reemplazosDelFuncionario = state.currentPageReplacements.filter(
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
      let filtrados = state.currentPageReplacements

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
    // New: Fetch paginated active replacements
    async fetchActiveReplacementsPaginated(params: {
      page?: number
      limit?: number
      search?: string
      servicio?: string
    }) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      this.cargando = true
      this.error = null

      try {
        const response = await ReplacementService.mostrarReemplazos(apiPrivate, params)

        // Check if response has pagination structure
        if (response.reemplazos && response.pagination) {
          // Server-side pagination response
          this.currentPageReplacements = response.reemplazos.map((r: RegisterDataReemplazo) => ({
            ...r,
            fecha_inicio: String(r.fecha_inicio).slice(0, 10),
            fecha_termino: String(r.fecha_termino).slice(0, 10)
          }))

          // Update pagination metadata
          this.currentPage = response.pagination.currentPage
          this.totalPages = response.pagination.totalPages
          this.totalItems = response.pagination.totalItems
          this.itemsPerPage = response.pagination.itemsPerPage
        } else {
          // Legacy response (array)
          this.currentPageReplacements = response.map((r: RegisterDataReemplazo) => ({
            ...r,
            fecha_inicio: String(r.fecha_inicio).slice(0, 10),
            fecha_termino: String(r.fecha_termino).slice(0, 10)
          }))
        }

        return response
      } catch (error: any) {
        console.error('Error al mostrar reemplazos:', error)
        this.error = 'No se pudieron cargar los reemplazos.'
        throw error
      } finally {
        this.cargando = false
      }
    },

    // Legacy: Keep for backward compatibility
    async mostrarReemplazos() {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      this.cargando = true
      this.error = null

      try {
        const data = await ReplacementService.mostrarReemplazos(apiPrivate)

        // Handle both response formats:
        // 1. New paginated format: { reemplazos: [...], pagination: {...} }
        // 2. Old array format: [...]
        let reemplazosArray: RegisterDataReemplazo[]

        if (data && typeof data === 'object' && 'reemplazos' in data) {
          // New paginated response
          reemplazosArray = data.reemplazos
        } else if (Array.isArray(data)) {
          // Old array response
          reemplazosArray = data
        } else {
          // Fallback to empty array
          reemplazosArray = []
        }

        this.reemplazosActivos = reemplazosArray.map((r: RegisterDataReemplazo) => ({
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
      this.cargando = true
      this.error = null

      try {
        const data = await ReplacementService.finalizarReemplazo(apiPrivate, reemplazoId)
        // Refresh current page after finalization
        await this.fetchActiveReplacementsPaginated({ page: this.currentPage })
        return data
      } catch (error: any) {
        console.error('Error al finalizar reemplazo:', error)
        this.error = 'No se pudo finalizar el reemplazo.'
        throw error
      } finally {
        this.cargando = false
      }
    },

    async anularReemplazo(reemplazoId: string) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      this.cargando = true
      this.error = null

      try {
        const data = await ReplacementService.anularReemplazo(apiPrivate, reemplazoId)
        // Refresh current page after annulment
        await this.fetchActiveReplacementsPaginated({ page: this.currentPage })
        return data
      } catch (error: any) {
        console.error('Error al anular reemplazo:', error)
        this.error = 'No se pudo anular el reemplazo.'
        throw error
      } finally {
        this.cargando = false
      }
    },

    async crearReemplazo(payload: RegisterDataReemplazo) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      this.cargando = true
      this.error = null

      try {
        const data = await ReplacementService.crearReemplazo(payload, apiPrivate)
        // Refresh current page after creation
        await this.fetchActiveReplacementsPaginated({ page: this.currentPage })
        return data
      } catch (error: any) {
        console.error('Error al crear reemplazo:', error)
        this.error = 'No se pudo crear el reemplazo.'
        throw error
      } finally {
        this.cargando = false
      }
    },

    async actualizarReemplazo(reemplazoId: string, payload: RegisterDataReemplazo) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      this.cargando = true
      this.error = null

      try {
        const data = await ReplacementService.actualizarReemplazo(apiPrivate, reemplazoId, payload)
        // Refresh current page after update
        await this.fetchActiveReplacementsPaginated({ page: this.currentPage })
        return data
      } catch (error: any) {
        console.error('Error al actualizar reemplazo:', error)
        this.error = 'No se pudo actualizar el reemplazo.'
        throw error
      } finally {
        this.cargando = false
      }
    },

    async procesarSustitucion(payload: SustitucionPayload) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      this.cargando = true
      this.error = null

      try {
        const data = await ReplacementService.procesarSustitucion(apiPrivate, payload)
        // Refresh current page after substitution
        await this.fetchActiveReplacementsPaginated({ page: this.currentPage })
        return data
      } catch (error: any) {
        console.error('Error al procesar sustitución:', error)
        this.error = 'No se pudo procesar la sustitución.'
        throw error
      } finally {
        this.cargando = false
      }
    },

    setFiltroServicio(servicio: string) {
      this.filtroServicio = servicio
    },

    setFiltroRutSaliente(rut: string) {
      this.filtroRutSaliente = rut
    },

    setFiltroRutEntrante(rut: string) {
      this.filtroRutEntrante = rut
    },

    setFechaInicio(fecha: string) {
      this.fechaInicio = fecha
    },

    setFechaFin(fecha: string) {
      this.fechaFin = fecha
    },

    limpiarFiltros() {
      this.filtroServicio = ''
      this.filtroRutSaliente = ''
      this.filtroRutEntrante = ''
      this.fechaInicio = ''
      this.fechaFin = ''
    }
  }
})

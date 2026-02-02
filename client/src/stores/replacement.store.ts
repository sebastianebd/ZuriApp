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

    // NEW: Finalized Replacements (Server-side Pagination)
    finalizedReplacements: [] as RegisterDataReemplazo[],
    finalizedPagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    },

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

    finalizedPaginationInfo: (state) => state.finalizedPagination,

    getFechasOcupadas:
      (state) =>
      (funcionarioId: string, sourceData?: RegisterDataReemplazo[]): string[] => {
        const fechasOcupadasSet = new Set<string>()
        const data = sourceData || state.currentPageReplacements
        const getId = (val: any) => (val && typeof val === 'object' && val._id ? val._id : val)

        // 1. Filtrar los reemplazos donde este funcionario es el ENTRANTE (Ya está trabajando)
        const reemplazosDelFuncionario = data.filter(
          (r) =>
            String(getId(r.id_entrante)) === String(funcionarioId) ||
            r.rut_entrante === funcionarioId
        )

        // 2. Expandir los rangos de fechas de cada reemplazo a días individuales
        reemplazosDelFuncionario.forEach((r) => {
          const fechasRango = getDatesInRange(r.fecha_inicio, r.fecha_termino)
          fechasRango.forEach((fecha) => fechasOcupadasSet.add(fecha))
        })

        // 3. Devolver la lista única de fechas ocupadas
        return Array.from(fechasOcupadasSet)
      },

    // NEW: Get dates where user is SALIENTE (Absent)
    getFechasAusencia:
      (state) =>
      (funcionarioId: string, sourceData?: RegisterDataReemplazo[]): string[] => {
        const fechasAusenciaSet = new Set<string>()
        const data = sourceData || state.currentPageReplacements
        const getId = (val: any) => (val && typeof val === 'object' && val._id ? val._id : val)

        // 1. Filtrar reemplazos donde es SALIENTE
        const ausencias = data.filter(
          (r) =>
            String(getId(r.id_saliente)) === String(funcionarioId) ||
            r.rut_saliente === funcionarioId
        )

        // 2. Expand ranges
        ausencias.forEach((r) => {
          const fechasRango = getDatesInRange(r.fecha_inicio, r.fecha_termino)
          fechasRango.forEach((fecha) => fechasAusenciaSet.add(fecha))
        })

        return Array.from(fechasAusenciaSet)
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

    // 🚀 NEW: Check conflicts without mutating state (for Modals)
    async checkConflicts(params: { search: string; limit?: number }) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      const searchTerm = params.search

      // Helper: Normalize RUT (remove dots, lowercase) for comparison
      const normalize = (val: string | undefined | null) => {
        if (!val) return ''
        return String(val).replace(/\./g, '').trim().toLowerCase()
      }

      const normalizedSearch = normalize(searchTerm)

      try {
        // WORKAROUND: Fetch ALL active replacements to manually filter client-side
        // This ensures we find records where the user is 'Entrante', which might be missed by backend search.
        const response = await ReplacementService.mostrarReemplazos(apiPrivate, { limit: 1000 })

        let allReplacements: RegisterDataReemplazo[] = []

        if (response.reemplazos) {
          allReplacements = response.reemplazos
        } else if (Array.isArray(response)) {
          allReplacements = response
        }

        // Filter: Match normalized RUT or ID in either role
        const matches = allReplacements.filter((r) => {
          const sRut = normalize(r.rut_saliente)
          const eRut = normalize(r.rut_entrante)
          const sId = String(r.id_saliente)
          const eId = String(r.id_entrante)

          return (
            sRut === normalizedSearch ||
            eRut === normalizedSearch ||
            sId === searchTerm || // ID match (case sensitive usually fine, but strictly equal)
            eId === searchTerm
          )
        })

        return matches.map((r) => ({
          ...r,
          fecha_inicio: String(r.fecha_inicio).slice(0, 10),
          fecha_termino: String(r.fecha_termino).slice(0, 10)
        }))
      } catch (error) {
        console.error('Error checking conflicts:', error)
        return []
      }
    },

    // New: Fetch paginated FINALIZED replacements (History)
    async fetchFinalizedPaginated(
      filtros: {
        rutSaliente?: string
        rutEntrante?: string
        fechaInicio?: string
        fechaFin?: string
        servicio?: string
      },
      page: number = 1
    ) {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      this.cargando = true
      this.error = null

      try {
        const response = await ReplacementService.obtenerInactivosPaginados(
          apiPrivate,
          filtros,
          page,
          this.finalizedPagination.itemsPerPage
        )

        // Update State
        this.finalizedReplacements = response.registros || []
        this.finalizedPagination = {
          currentPage: response.paginaActual,
          totalPages: response.totalPages,
          totalItems: response.totalRegistros,
          itemsPerPage: response.limite
        }

        return response
      } catch (error: any) {
        console.error('Error fetching finalized replacements:', error)
        this.error = 'No se pudo cargar el historial de reemplazos.'
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

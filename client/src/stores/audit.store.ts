import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth.store'
import * as AuditService from '../services/audit.service'
import type { AuditFilterOptions } from '../services/audit.service'

export const useAuditStore = defineStore('audit', () => {
  const authStore = useAuthStore()
  const logs = ref<any[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filtros actuales
  const currentFilters = ref({
    module: '',
    action: '',
    startDate: '',
    endDate: '',
    userId: ''
  })

  // Opciones de filtro dinámicas (cacheadas desde el backend)
  const filterOptions = ref<AuditFilterOptions | null>(null)

  async function fetchFilterOptions(): Promise<AuditFilterOptions> {
    // Cache: Si ya las tenemos, no volvemos a consultar
    if (filterOptions.value) {
      return filterOptions.value
    }
    const apiPrivate = authStore.usePrivateApi()
    const data = await AuditService.getAuditOptions(apiPrivate)
    filterOptions.value = data
    return filterOptions.value
  }

  async function fetchLogs(page = 1, limit = 14, filters: any = {}, isBackgroundUpdate = false) {
    if (!isBackgroundUpdate) loading.value = true
    error.value = null
    try {
      // Actualizar estado de filtros
      currentFilters.value = { ...filters }
      currentPage.value = page

      const apiPrivate = authStore.usePrivateApi()
      const data = await AuditService.getAuditLogs(apiPrivate, page, limit, filters)

      logs.value = data.logs
      total.value = data.total
      totalPages.value = data.totalPages
    } catch (err: any) {
      console.error('Error fetching audit logs:', err)
      error.value = err.response?.data?.mensaje || 'Error al cargar historial de auditoría'
    } finally {
      if (!isBackgroundUpdate) loading.value = false
    }
  }

  // Fetch for export (No limit/High limit)
  async function getLogsForExport(filters: any = {}) {
    loading.value = true
    try {
      const apiPrivate = authStore.usePrivateApi()
      return await AuditService.getLogsForExport(apiPrivate, filters)
    } catch (err: any) {
      console.error('Error fetching export logs:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    logs,
    total,
    currentPage,
    totalPages,
    loading,
    error,
    currentFilters,
    filterOptions,
    fetchFilterOptions,
    fetchLogs,
    getLogsForExport
  }
})

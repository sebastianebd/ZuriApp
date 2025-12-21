import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth.store'

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

  async function fetchLogs(page = 1, limit = 14, filters: any = {}) {
    loading.value = true
    error.value = null
    try {
      // Actualizar estado de filtros
      currentFilters.value = { ...filters }
      currentPage.value = page

      // Construir query params
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', limit.toString())

      if (filters.module && filters.module !== 'TODOS') params.append('module', filters.module)
      if (filters.action && filters.action !== 'TODOS') params.append('action', filters.action)
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const axios = authStore.usePrivateApi()
      const response = await axios.get(`/audit?${params.toString()}`)

      logs.value = response.data.logs
      total.value = response.data.total
      totalPages.value = response.data.totalPages
    } catch (err: any) {
      console.error('Error fetching audit logs:', err)
      error.value = err.response?.data?.mensaje || 'Error al cargar historial de auditoría'
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
    fetchLogs
  }
})

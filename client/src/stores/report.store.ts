import { defineStore } from 'pinia'
import { ref } from 'vue'
import { axiosPrivateInstance as axios } from '@/config/axios'

export const useReportStore = defineStore('report', () => {
  const isLoading = ref(false)
  const reportData = ref<any>(null)
  const error = ref<string | null>(null) // State for error messages

  const currentFilters = ref({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    userId: ''
  })

  // Fetch summary JSON
  const fetchReportSummary = async (options?: { preview?: boolean }) => {
    if (!currentFilters.value.userId) return

    try {
      isLoading.value = true
      error.value = null // Reset error

      const params = { ...currentFilters.value, ...options, _t: Date.now() }

      const { data } = await axios.get('/reports/summary', {
        params
      })
      reportData.value = data
    } catch (err: any) {
      // Only log unexpected errors (non-404)
      if (err.response?.status !== 404) {
        console.error('Error fetching report:', err)
      }

      reportData.value = null
      error.value = err.response?.data?.message || 'Error al obtener el reporte.'
    } finally {
      isLoading.value = false
    }
  }

  // Trigger Excel Download
  const downloadExcel = async () => {
    if (!currentFilters.value.userId) return

    try {
      const response = await axios.get('/reports/export/excel', {
        params: currentFilters.value,
        responseType: 'blob' // Important for binary files
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const filename = `Reporte_${currentFilters.value.userId}.xlsx`
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error downloading excel:', error)
    }
  }

  return {
    isLoading,
    reportData,
    error,
    currentFilters,
    fetchReportSummary,
    downloadExcel
  }
})

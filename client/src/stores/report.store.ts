import { defineStore } from 'pinia'
import { ref } from 'vue'
import { axiosPrivateInstance as axios } from '@/config/axios'

export const useReportStore = defineStore('report', () => {
  const isLoading = ref(false)
  const reportData = ref<any>(null)

  const currentFilters = ref({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    userId: ''
  })

  // Fetch summary JSON
  const fetchReportSummary = async () => {
    if (!currentFilters.value.userId) return

    try {
      isLoading.value = true
      const { data } = await axios.get('/reports/summary', {
        params: currentFilters.value
      })
      reportData.value = data
    } catch (error) {
      console.error('Error fetching report:', error)
      reportData.value = null
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
    currentFilters,
    fetchReportSummary,
    downloadExcel
  }
})

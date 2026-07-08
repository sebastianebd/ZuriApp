import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as ReportService from '@/services/report.service'
import { useAuthStore } from './auth.store'
import type { AxiosInstance } from 'axios'

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

      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      const data = await ReportService.fetchReportSummary(apiPrivate, params)
      reportData.value = data
    } catch (err: any) {
      // Only log unexpected errors (non-404)
      if (err.response?.status !== 404) {
        console.error('Error fetching report:', err)
      }

      reportData.value = null
      if (err.response?.status === 404) {
        error.value = 'No se encontraron registros para este usuario en el periodo seleccionado.'
      } else {
        error.value = err.response?.data?.message || 'Error al obtener el reporte.'
      }
    } finally {
      isLoading.value = false
    }
  }

  // Trigger Excel Download
  const downloadExcel = async () => {
    if (!currentFilters.value.userId) return

    try {
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      const data = await ReportService.downloadServiceExcelService(apiPrivate, currentFilters.value);
      const response = { data };

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


  const downloadIndividualExcel = async (month: number, year: number, userId: string) => {
    try {
      error.value = null
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      const data = await ReportService.downloadIndividualExcelService(apiPrivate, { month, year, userId })
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Cartola_${userId}_${month}_${year}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err: any) {
      error.value = 'No se encontraron registros para este usuario en el periodo seleccionado.'
      throw err
    }
  }

  const downloadServiceExcel = async (month: number, year: number, serviceId: string) => {
    try {
      error.value = null
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      const data = await ReportService.downloadServiceExcelService(apiPrivate, { month, year, serviceId })
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Reporte_Servicio_${serviceId}_${month}_${year}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err: any) {
      if (err.response?.status === 404) {
        error.value = 'No se encontraron registros para este servicio en el periodo seleccionado.'
      } else {
        error.value = 'Error al descargar avance.'
      }
      throw err
    }
  }

  const downloadServicePDF = async (month: number, year: number, serviceId: string) => {
    try {
      error.value = null
      const authStore = useAuthStore()
      const apiPrivate: AxiosInstance = authStore.usePrivateApi()
      const data = await ReportService.fetchServicePdf(apiPrivate, { month, year, serviceId })
      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'El PDF no se encuentra disponible.'
      throw err
    }
  }

  return {
    isLoading,
    reportData,
    error,
    currentFilters,
    fetchReportSummary,
    downloadExcel,
    downloadIndividualExcel,
    downloadServiceExcel,
    downloadServicePDF
  }
})

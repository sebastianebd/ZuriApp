import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as DashboardService from '../services/dashboard.service'
import { useApiPrivate } from '../composables/useApi'
import type {
  DashboardKPIResponse,
  UpdateServiceStaffingPayload,
} from '../types/dashboard.types'
import socket from '../plugins/socket'

export const useDashboardStore = defineStore('dashboard', () => {
  const currentDate = new Date()
  const selectedServiceId = ref<string>('')
  const selectedMonth = ref<number>(currentDate.getMonth() + 1)
  const selectedYear = ref<number>(currentDate.getFullYear())

  const kpiData = ref<DashboardKPIResponse['data'] | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const showStaffingModal = ref<boolean>(false)

  let socketBound = false

  const fetchKPIs = async (
    serviceId?: string,
    month?: number,
    year?: number,
    refresh = false,
  ) => {
    if (serviceId) selectedServiceId.value = serviceId
    if (month) selectedMonth.value = month
    if (year) selectedYear.value = year

    if (!selectedServiceId.value) return

    loading.value = true
    error.value = null

    try {
      const apiPrivate = useApiPrivate()
      const res = await DashboardService.getServiceKPIs(
        apiPrivate,
        selectedServiceId.value,
        selectedMonth.value,
        selectedYear.value,
        refresh,
      )
      if (res.success && res.data) {
        kpiData.value = res.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al cargar los KPIs'
    } finally {
      loading.value = false
    }
  }

  const setSelectedService = async (serviceId: string) => {
    if (selectedServiceId.value && selectedServiceId.value !== serviceId) {
      socket.emit('leave:service', selectedServiceId.value)
    }

    selectedServiceId.value = serviceId
    localStorage.setItem('zuriapp_preferred_service', serviceId)
    socket.emit('join:service', serviceId)

    await fetchKPIs(serviceId)
  }

  const initSocketListeners = () => {
    if (socketBound) return
    socketBound = true

    socket.on('dashboard:invalidated', async (payload: { serviceId: string }) => {
      if (payload && payload.serviceId === selectedServiceId.value) {
        await fetchKPIs()
      }
    })
  }

  const removeSocketListeners = () => {
    socket.off('dashboard:invalidated')
    if (selectedServiceId.value) {
      socket.emit('leave:service', selectedServiceId.value)
    }
    socketBound = false
  }

  const saveStaffing = async (payload: UpdateServiceStaffingPayload) => {
    if (!selectedServiceId.value) return
    loading.value = true
    error.value = null

    try {
      const apiPrivate = useApiPrivate()
      await DashboardService.updateServiceStaffing(
        apiPrivate,
        selectedServiceId.value,
        payload,
      )
      await fetchKPIs()
      showStaffingModal.value = false
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al actualizar dotación'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    selectedServiceId,
    selectedMonth,
    selectedYear,
    kpiData,
    loading,
    error,
    showStaffingModal,
    fetchKPIs,
    setSelectedService,
    initSocketListeners,
    removeSocketListeners,
    saveStaffing,
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AlertDTO } from '../types/alert.types'
import * as AlertService from '../services/alert.service'
import { useApiPrivate } from '../composables/useApi'
import socket from '../plugins/socket'

export const useAlertStore = defineStore('alert', () => {
  const alerts = ref<AlertDTO[]>([])
  const unreadCount = ref<number>(0)
  const countsBySeverity = ref<{
    critical: number
    high: number
    medium: number
  }>({
    critical: 0,
    high: 0,
    medium: 0,
  })
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const selectedAlert = ref<AlertDTO | null>(null)
  const showDetailModal = ref<boolean>(false)
  const activeServiceId = ref<string>('')

  let socketBound = false

  const recalculateCounts = () => {
    unreadCount.value = alerts.value.filter((a) => a.status === 'active').length
    countsBySeverity.value = {
      critical: alerts.value.filter((a) => a.severity === 'critical').length,
      high: alerts.value.filter((a) => a.severity === 'high').length,
      medium: alerts.value.filter((a) => a.severity === 'medium').length,
    }
  }

  const fetchAlerts = async (serviceId?: string) => {
    const sId = serviceId
    if (serviceId !== undefined) {
      activeServiceId.value = serviceId
    }

    loading.value = true
    error.value = null

    try {
      const apiPrivate = useApiPrivate()
      const response = await AlertService.getAlerts(apiPrivate, sId || undefined)
      if (response && response.data) {
        alerts.value = response.data.alerts || []
        unreadCount.value = response.data.unreadCount || 0
        countsBySeverity.value = response.data.countsBySeverity || {
          critical: 0,
          high: 0,
          medium: 0,
        }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al obtener alertas'
    } finally {
      loading.value = false
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const apiPrivate = useApiPrivate()
      await AlertService.acknowledgeAlert(apiPrivate, alertId)

      const target = alerts.value.find((a) => a.id === alertId)
      if (target) {
        target.status = 'acknowledged'
      }
      recalculateCounts()
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al reconocer la alerta'
      throw err
    }
  }

  const resolveAlert = async (alertId: string, note: string) => {
    try {
      const apiPrivate = useApiPrivate()
      await AlertService.resolveAlert(apiPrivate, alertId, { resolutionNote: note })

      // Remover alerta resuelta de la lista de activas
      alerts.value = alerts.value.filter((a) => a.id !== alertId)
      recalculateCounts()

      if (selectedAlert.value?.id === alertId) {
        showDetailModal.value = false
        selectedAlert.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al resolver la alerta'
      throw err
    }
  }

  const openDetail = (alert: AlertDTO) => {
    selectedAlert.value = alert
    showDetailModal.value = true
  }

  const closeDetail = () => {
    showDetailModal.value = false
    selectedAlert.value = null
  }

  const initSocketListeners = () => {
    if (socketBound || !socket) return
    socketBound = true

    if (!socket.connected && typeof socket.connect === 'function') {
      try {
        const rawAuth = sessionStorage.getItem('auth')
        const token = rawAuth ? JSON.parse(rawAuth)?.accessToken : undefined
        if (token) {
          socket.auth = { ...socket.auth, token }
        }
      } catch {
        // Ignorar
      }
      socket.connect()
    }

    socket.on('alert:new', (newAlert: AlertDTO) => {
      // Prevenir duplicados en lista local
      if (!alerts.value.some((a) => a.id === newAlert.id)) {
        const alertItem: AlertDTO = {
          ...newAlert,
          status: newAlert.status || 'active',
          createdAt: newAlert.createdAt || new Date().toISOString(),
        }
        alerts.value.unshift(alertItem)
        recalculateCounts()
      }
    })

    socket.on('alert:acknowledged', (payload: { alertId: string }) => {
      const id = payload?.alertId || (payload as any)
      const target = alerts.value.find((a) => a.id === id)
      if (target) {
        target.status = 'acknowledged'
        recalculateCounts()
      }
    })

    socket.on('alert:resolved', (payload: { alertId: string }) => {
      const id = payload?.alertId || (payload as any)
      alerts.value = alerts.value.filter((a) => a.id !== id)
      recalculateCounts()

      if (selectedAlert.value?.id === id) {
        showDetailModal.value = false
        selectedAlert.value = null
      }
    })
  }

  const removeSocketListeners = () => {
    socket.off('alert:new')
    socket.off('alert:acknowledged')
    socket.off('alert:resolved')
    socketBound = false
  }

  return {
    alerts,
    unreadCount,
    countsBySeverity,
    loading,
    error,
    selectedAlert,
    showDetailModal,
    activeServiceId,
    fetchAlerts,
    acknowledgeAlert,
    resolveAlert,
    openDetail,
    closeDetail,
    initSocketListeners,
    removeSocketListeners,
  }
})

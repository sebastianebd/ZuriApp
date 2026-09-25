import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import portalService from '@/services/portal.service'
import socket from '@/plugins/socket'
import type {
  PwaUserProfile,
  PortalHomeData,
  PortalShiftsViewData,
  UserPreferencesDTO,
  PortalNotification,
} from '@/types/portal.types'

export const usePortalStore = defineStore('portal', () => {
  const user = ref<PwaUserProfile | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const homeData = ref<PortalHomeData | null>(null)
  const shiftsData = ref<PortalShiftsViewData | null>(null)

  const defaultNotifications: PortalNotification[] = [
    {
      id: 'notif-schedule-current',
      type: 'schedule_published',
      title: 'Rol de Turnos Publicado',
      message: 'Tu jefatura ha publicado la programación oficial de turnos para el periodo actual.',
      date: new Date().toISOString(),
      acknowledged: false,
    },
    {
      id: 'notif-rep-current',
      type: 'replacement_assigned',
      title: 'Asignación de Reemplazo Cargada',
      message: 'Se ha programado una asignación de reemplazo a tu nombre. Revisa las jornadas en tu sección de turnos.',
      date: new Date(Date.now() - 3600000 * 5).toISOString(),
      acknowledged: false,
    },
  ]

  function getAcks(): Record<string, string> {
    try {
      const saved = localStorage.getItem('portal_acknowledged_notifs')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  }

  function getDeletedIds(): string[] {
    try {
      const saved = localStorage.getItem('portal_deleted_notifs')
      return saved ? (JSON.parse(saved) as string[]) : []
    } catch {
      return []
    }
  }

  const notifications = ref<PortalNotification[]>(
    defaultNotifications
      .filter(n => !getDeletedIds().includes(n.id))
      .map(n => ({
        ...n,
        acknowledged: !!getAcks()[n.id],
        acknowledgedAt: getAcks()[n.id] || undefined,
      }))
  )

  const unreadNotificationsCount = computed(() =>
    notifications.value.filter(n => !n.acknowledged).length
  )

  function acknowledgeNotification(id: string) {
    const notif = notifications.value.find(n => n.id === id)
    if (notif) {
      notif.acknowledged = true
      notif.acknowledgedAt = new Date().toISOString()
      try {
        const saved = localStorage.getItem('portal_acknowledged_notifs')
        const acks = saved ? JSON.parse(saved) : {}
        acks[id] = notif.acknowledgedAt
        localStorage.setItem('portal_acknowledged_notifs', JSON.stringify(acks))
      } catch {
        // Ignore localStorage error
      }
    }
  }

  function deleteNotification(id: string) {
    notifications.value = notifications.value.filter(n => n.id !== id)
    try {
      const saved = localStorage.getItem('portal_deleted_notifs')
      const deletedIds: string[] = saved ? JSON.parse(saved) : []
      if (!deletedIds.includes(id)) {
        deletedIds.push(id)
        localStorage.setItem('portal_deleted_notifs', JSON.stringify(deletedIds))
      }
    } catch {
      // Ignore localStorage error
    }
  }

  const isHonorario = computed(() => user.value?.contractType === 'HONORARIO')

  async function requestOtp(rut: string) {
    isLoading.value = true
    try {
      return await portalService.requestOtp(rut)
    } finally {
      isLoading.value = false
    }
  }

  async function verifyOtp(rut: string, otp: string) {
    isLoading.value = true
    try {
      const response = await portalService.verifyOtp(rut, otp)
      user.value = response.user || (response as any).data?.staff || (response as any).data?.user || null
      isAuthenticated.value = !!user.value
      const token = (response as any).token || (response as any).data?.token
      if (token) {
        try {
          localStorage.setItem('zuriapp_pwa_token', token)
        } catch {
          // Ignorar
        }
      }
      return response
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMe() {
    try {
      const response = await portalService.getMe()
      user.value = response.user || (response as any).data?.staff || (response as any).data?.user || null
      isAuthenticated.value = !!user.value
      return user.value
    } catch (error) {
      user.value = null
      isAuthenticated.value = false
      return null
    }
  }

  async function fetchHome() {
    isLoading.value = true
    try {
      const data = await portalService.getHome()
      homeData.value = data
      return data
    } finally {
      isLoading.value = false
    }
  }

  async function confirmNextShift(
    id: string,
    assignmentModel: 'TurnAssignment' | 'Replacement',
    date: string
  ) {
    const result = await portalService.confirmShift(id, assignmentModel, date)
    if (homeData.value?.nextShift && homeData.value.nextShift.id === id) {
      homeData.value.nextShift.confirmationStatus = 'confirmed'
    }
    return result
  }

  async function reportUnavailableNextShift(
    id: string,
    assignmentModel: 'TurnAssignment' | 'Replacement',
    date: string,
    reason: string
  ) {
    const result = await portalService.reportUnavailable(id, assignmentModel, date, reason)
    if (homeData.value?.nextShift && homeData.value.nextShift.id === id) {
      homeData.value.nextShift.confirmationStatus = 'unavailable'
    }
    return result
  }

  async function downloadAdvancePdf(month?: number, year?: number) {
    const blob = await portalService.downloadAdvancePdf(month, year)
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `avance_mes_${year || new Date().getFullYear()}_${month || new Date().getMonth() + 1}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  async function updatePreferences(preferences: UserPreferencesDTO) {
    await portalService.updatePreferences(preferences)
    if (user.value) {
      if (!user.value.notificationPreferences) {
        user.value.notificationPreferences = {
          shiftReminders: true,
          shiftChanges: true,
          openCallsEnabled: true,
          preferredServices: [],
          quietHours: { enabled: true, start: '22:00', end: '07:00' },
        }
      }
      if (preferences.shiftReminders !== undefined) {
        user.value.notificationPreferences.shiftReminders = preferences.shiftReminders
      }
      if (preferences.shiftChanges !== undefined) {
        user.value.notificationPreferences.shiftChanges = preferences.shiftChanges
      }
      if (preferences.openCallsEnabled !== undefined) {
        user.value.notificationPreferences.openCallsEnabled = preferences.openCallsEnabled
      }
      if (preferences.preferredServices !== undefined) {
        user.value.notificationPreferences.preferredServices = preferences.preferredServices
      }
      if (preferences.quietHours !== undefined) {
        user.value.notificationPreferences.quietHours = preferences.quietHours
      }
    }
  }

  async function fetchShifts(month: number, year: number) {
    isLoading.value = true
    try {
      const data = await portalService.getShifts(month, year)
      shiftsData.value = data
      return data
    } finally {
      isLoading.value = false
    }
  }

  async function downloadCartolaPdf(month: number, year: number) {
    const blob = await portalService.downloadCartolaPdf(month, year)
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `cartola_oficial_${year}_${month}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  async function downloadReplacementVoucherPdf(replacementId: string) {
    const blob = await portalService.downloadReplacementVoucherPdf(replacementId)
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `comprobante_reemplazo_${replacementId}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  async function logout() {
    try {
      await portalService.logout()
    } catch {
      // Ignore logout errors
    } finally {
      try {
        localStorage.removeItem('zuriapp_pwa_token')
      } catch {
        // ignore
      }
      user.value = null
      isAuthenticated.value = false
      homeData.value = null
      shiftsData.value = null
    }
  }

  async function syncOpenOffersNotifications() {
    if (!isHonorario.value) return
    try {
      const openOffers = await portalService.getOpenOffers()
      const deletedIds = getDeletedIds()
      const acks = getAcks()
      for (const offer of openOffers) {
        const notifId = `notif-offer-${offer.id}`
        if (!notifications.value.some((n) => n.id === notifId) && !deletedIds.includes(notifId)) {
          notifications.value.unshift({
            id: notifId,
            type: 'offer_published',
            title: 'Nueva Convocatoria en Bolsa',
            message: `Hay una convocatoria abierta para ${offer.positionName} en ${offer.serviceName} (${offer.tipo_turno}). Postula antes de su vencimiento.`,
            date: offer.createdAt || new Date().toISOString(),
            acknowledged: !!acks[notifId],
            acknowledgedAt: acks[notifId] || undefined,
          })
        }
      }
    } catch {
      // Ignorar fallas de red silenciosamente
    }
  }

  let socketBound = false

  function setupSocketListeners() {
    if (socketBound || !socket) return
    socketBound = true

    try {
      const pwaToken = localStorage.getItem('zuriapp_pwa_token')
      if (pwaToken) {
        socket.auth = { ...socket.auth, pwaToken }
      }
    } catch {
      // Ignorar
    }

    if (!socket.connected) {
      socket.connect()
    }

    socket.on('offer:created', async () => {
      await syncOpenOffersNotifications()
    })

    socket.on('offer:awarded', async (payload: any) => {
      if (user.value && payload?.staffId === user.value.id) {
        const notifId = `notif-rep-awarded-${payload.replacementId || payload.offerId || Date.now()}`
        if (!notifications.value.some((n) => n.id === notifId)) {
          notifications.value.unshift({
            id: notifId,
            type: 'replacement_assigned',
            title: '¡Turno Adjudicado!',
            message: payload.message || `Has sido seleccionado/a para el reemplazo en ${payload.serviceName || 'Servicio'} (${payload.tipo_turno || ''}). Revisa tus turnos en el calendario.`,
            date: new Date().toISOString(),
            acknowledged: false,
          })
        }
        await fetchHome()
        if (shiftsData.value) {
          await fetchShifts(shiftsData.value.period.month, shiftsData.value.period.year)
        }
      }
    })

    socket.on('turn:update', async (payload: any) => {
      if (user.value && payload?.staffId === user.value.id) {
        await fetchHome()
        if (shiftsData.value) {
          await fetchShifts(shiftsData.value.period.month, shiftsData.value.period.year)
        }
      }
    })
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    homeData,
    shiftsData,
    notifications,
    unreadNotificationsCount,
    acknowledgeNotification,
    deleteNotification,
    isHonorario,
    requestOtp,
    verifyOtp,
    fetchMe,
    fetchHome,
    fetchShifts,
    confirmNextShift,
    reportUnavailableNextShift,
    downloadAdvancePdf,
    downloadCartolaPdf,
    downloadReplacementVoucherPdf,
    updatePreferences,
    syncOpenOffersNotifications,
    setupSocketListeners,
    logout,
  }
})

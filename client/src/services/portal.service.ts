import axios from 'axios'
import type {
  PwaUserProfile,
  PortalHomeData,
  UserPreferencesDTO,
  PwaOpenOfferItem,
  PwaMyApplicationItem,
} from '@/types/portal.types'

const portalApi = axios.create({
  baseURL: '/api/pwa',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

const offersApi = axios.create({
  baseURL: '/api/replacement-offers',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

function getApplicationStatusMeta(status: string, offerStatus?: string): { label: string; color: string } {
  switch (status) {
    case 'selected':
      return { label: 'Adjudicado', color: 'success' }
    case 'not_selected':
      return { label: 'No seleccionado', color: 'secondary' }
    case 'withdrawn_conflict':
      return { label: 'Retirado por conflicto', color: 'danger' }
    case 'cancelled_by_staff':
      return { label: 'Cancelado', color: 'secondary' }
    case 'pending':
    default:
      if (offerStatus === 'cancelled') {
        return { label: 'Anulada', color: 'dark' }
      }
      if (offerStatus && offerStatus !== 'open') {
        return { label: 'En evaluación', color: 'warning' }
      }
      return { label: 'En postulación', color: 'warning' }
  }
}

export const portalService = {
  // Autenticación OTP
  async requestOtp(rut: string) {
    const response = await portalApi.post<{
      success: boolean
      maskedPhone: string
      expiresInSeconds: number
      resendCooldownSeconds: number
    }>('/auth/request-otp', { rut })
    return response.data
  },

  async verifyOtp(rut: string, otp: string) {
    const response = await portalApi.post<any>('/auth/verify-otp', { rut, otp })
    const user = response.data?.user || response.data?.data?.user || response.data?.data?.staff
    return { ...response.data, user }
  },

  async getMe() {
    const response = await portalApi.get<any>('/auth/me')
    const user = response.data?.user || response.data?.data?.user || response.data?.data?.staff
    return { ...response.data, user }
  },

  async logout() {
    const response = await portalApi.post<{
      success: boolean
      message: string
    }>('/auth/logout')
    return response.data
  },

  // Turnos y Home
  async getHome() {
    const response = await portalApi.get<{
      success: boolean
      data: PortalHomeData
    }>('/home')
    return response.data.data
  },

  async getShifts(month: number, year: number) {
    const response = await portalApi.get<{
      success: boolean
      data: any
    }>(`/shifts?month=${month}&year=${year}`)
    return response.data.data
  },

  async confirmShift(id: string, assignmentModel: 'TurnAssignment' | 'Replacement', date: string) {
    const response = await portalApi.post<{
      success: boolean
      message: string
    }>(`/shifts/${id}/confirm`, { assignmentModel, date })
    return response.data
  },

  async reportUnavailable(
    id: string,
    assignmentModel: 'TurnAssignment' | 'Replacement',
    date: string,
    reason: string
  ) {
    const response = await portalApi.post<{
      success: boolean
      message: string
    }>(`/shifts/${id}/unavailable`, { assignmentModel, date, reason })
    return response.data
  },

  // Reportes PDF
  async downloadAdvancePdf(month?: number, year?: number) {
    const query = month && year ? `?month=${month}&year=${year}` : ''
    const response = await portalApi.get(`/reports/advance${query}`, {
      responseType: 'blob',
    })
    return response.data
  },

  async downloadCartolaPdf(month: number, year: number) {
    const response = await portalApi.get(`/reports/cartola?month=${month}&year=${year}`, {
      responseType: 'blob',
    })
    return response.data
  },

  async downloadReplacementVoucherPdf(replacementId: string) {
    const response = await portalApi.get(`/replacements/${replacementId}/voucher`, {
      responseType: 'blob',
    })
    return response.data
  },

  // Preferencias
  async updatePreferences(preferences: UserPreferencesDTO) {
    const response = await portalApi.patch<{
      success: boolean
      message: string
    }>('/profile/preferences', preferences)
    return response.data
  },

  // Bolsa de Reemplazos PWA (Task 15)
  async getOpenOffers(): Promise<PwaOpenOfferItem[]> {
    const response = await offersApi.get<{
      success: boolean
      data: any[]
    }>('/open')
    return (response.data.data || []).map((item) => ({
      ...item,
      alreadyApplied: item.hasApplied !== undefined ? item.hasApplied : !!item.alreadyApplied,
    }))
  },

  async getMyApplications(): Promise<PwaMyApplicationItem[]> {
    const response = await offersApi.get<{
      success: boolean
      data: any[]
    }>('/my-applications')
    return (response.data.data || []).map((item) => {
      const status = item.myStatus || item.status || 'pending'
      const meta = getApplicationStatusMeta(status, item.offerStatus)
      return {
        ...item,
        status,
        statusLabel: item.statusLabel || meta.label,
        statusColor: item.statusColor || meta.color,
      }
    })
  },

  async applyToOffer(offerId: string): Promise<void> {
    const response = await offersApi.post(`/${offerId}/apply`)
    return response.data
  },

  async withdrawApplication(offerId: string): Promise<void> {
    const response = await offersApi.post(`/${offerId}/withdraw`)
    return response.data
  },
}

export default portalService

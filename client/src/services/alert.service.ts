import type {
  AlertDTO,
  AlertsListResponse,
  ResolveAlertPayload,
} from '../types/alert.types'

export const getAlerts = async (
  apiPrivate: any,
  serviceId?: string,
  status = 'active',
): Promise<AlertsListResponse> => {
  const params: Record<string, string> = { status }
  if (serviceId) {
    params.serviceId = serviceId
  }
  const { data } = await apiPrivate.get('/alerts', { params })
  return data
}

export const acknowledgeAlert = async (
  apiPrivate: any,
  alertId: string,
): Promise<{ success: boolean; data: AlertDTO }> => {
  const { data } = await apiPrivate.patch(`/alerts/${alertId}/acknowledge`)
  return data
}

export const resolveAlert = async (
  apiPrivate: any,
  alertId: string,
  payload: ResolveAlertPayload,
): Promise<{ success: boolean; data: AlertDTO }> => {
  const { data } = await apiPrivate.patch(`/alerts/${alertId}/resolve`, payload)
  return data
}

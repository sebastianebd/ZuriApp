import type { useApiPrivate } from '../composables/useApi'
import type {
  DashboardKPIResponse,
  UpdateServiceStaffingPayload,
} from '../types/dashboard.types'

export const getServiceKPIs = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  serviceId: string,
  month?: number,
  year?: number,
  refresh?: boolean,
): Promise<DashboardKPIResponse> => {
  const params: Record<string, any> = {}
  if (month) params.month = month
  if (year) params.year = year
  if (refresh) params.refresh = 'true'
  const { data } = await apiPrivate.get(`/dashboard/${serviceId}/kpis`, { params })
  return data
}

export const updateServiceStaffing = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  serviceId: string,
  payload: UpdateServiceStaffingPayload,
): Promise<{ success: boolean; data: any; message?: string }> => {
  const { data } = await apiPrivate.patch(`/services/${serviceId}/staffing`, payload)
  return data
}

export default {
  getServiceKPIs,
  updateServiceStaffing,
}

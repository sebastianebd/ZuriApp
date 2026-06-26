import type { useApiPrivate } from '../composables/useApi'
import { errorHandler } from '../utils/errorHandler'

export interface AuditFilterOptions {
  modules: string[]
  actions: string[]
}

export const getAuditOptions = async (
  apiPrivate: ReturnType<typeof useApiPrivate>
): Promise<AuditFilterOptions> => {
  try {
    const { data } = await apiPrivate.get('/audit/options')
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const getAuditLogs = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  page: number = 1,
  limit: number = 10,
  filters: Record<string, string> = {}
) => {
  try {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    if (filters.module) params.append('module', filters.module)
    if (filters.action) params.append('action', filters.action)
    if (filters.userId) params.append('userId', filters.userId)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)

    const { data } = await apiPrivate.get(`/audit?${params.toString()}`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const getLogsForExport = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  filters: Record<string, string> = {}
) => {
  try {
    const params = new URLSearchParams()
    params.append('page', '1')
    params.append('limit', '10000')

    if (filters.module) params.append('module', filters.module)
    if (filters.action) params.append('action', filters.action)
    if (filters.userId) params.append('userId', filters.userId)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)

    const { data } = await apiPrivate.get(`/audit?${params.toString()}`)
    return data.logs
  } catch (error) {
    throw errorHandler(error)
    return []
  }
}

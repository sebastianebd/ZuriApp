import { errorHandler } from '@/utils/errorHandler'
import { useApiPrivate } from '../composables/useApi'

export const getReplacementStats = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.get('/api/profile/stats/replacements')
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const getServiceStats = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.get('/api/profile/stats/services')
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const getRecentActivity = async (apiPrivate: ReturnType<typeof useApiPrivate>) => {
  try {
    const { data } = await apiPrivate.get('/api/profile/activity/recent')
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

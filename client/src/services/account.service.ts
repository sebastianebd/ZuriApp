import { errorHandler } from '@/utils/errorHandler'
import type { useApiPrivate } from '../composables/useApi'

export const sendResetLink = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  staffId: string
) => {
  try {
    const { data } = await apiPrivate.post(`/staff/${staffId}/send-reset-link`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

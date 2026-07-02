import { useApi } from '../composables/useApi'
import { errorHandler } from '../utils/errorHandler'

const Api = useApi()

export const getPublicShifts = async (userId: string, month: number, year: number) => {
  try {
    const { data } = await Api.get('/public/shifts', {
      params: { userId, month, year }
    })
    return data
  } catch (error) {
    throw errorHandler(error, true)
  }
}

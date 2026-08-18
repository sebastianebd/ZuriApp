import { errorHandler } from '@/utils/errorHandler'
import type { useApiPrivate } from '../composables/useApi'
import { type StaffRegistration } from '../types/staff.types'

export const createStaff = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  payload: StaffRegistration
) => {
  try {
    const { data } = await apiPrivate.post('/staff', payload)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const updateStaff = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  staffId: string,
  payload: Partial<StaffRegistration>
) => {
  try {
    const { data } = await apiPrivate.put(`/staff/${staffId}`, payload)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const deleteStaff = async (apiPrivate: ReturnType<typeof useApiPrivate>, id: string) => {
  try {
    const { data } = await apiPrivate.delete(`/staff/${id}`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const getAllStaff = async (
  apiPrivate: ReturnType<typeof useApiPrivate>,
  params?: {
    search?: string
    rut?: string
    page?: number
    limit?: number
    roleId?: string
    positionId?: string
    isActive?: boolean
  }
) => {
  try {
    const { data } = await apiPrivate.get('/staff', { params })
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

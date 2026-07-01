import { errorHandler } from '../utils/errorHandler'
import type { AxiosInstance } from 'axios'

export interface CreateExceptionPayload {
  assignment_id: string
  date: string
  original_type: string
  override_type: string
  reason?: string
  created_by: string
}

export const fetchExceptions = async (
  api: AxiosInstance,
  params: { assignment_id?: string; start_date?: string; end_date?: string } = {}
) => {
  try {
    const { data } = await api.get('/shift-exceptions', { params })
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const createShiftException = async (api: AxiosInstance, payload: CreateExceptionPayload) => {
  try {
    const { data } = await api.post('/shift-exceptions', payload)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const deleteShiftException = async (api: AxiosInstance, id: string) => {
  try {
    const { data } = await api.delete(`/shift-exceptions/${id}`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

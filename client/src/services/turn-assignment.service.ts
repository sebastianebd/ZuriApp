import { errorHandler } from '../utils/errorHandler'
import type { AxiosInstance } from 'axios'

export const fetchAssignments = async (apiPrivate: AxiosInstance, filters: any = {}) => {
  try {
    const { data } = await apiPrivate.get('/assignments', { params: filters })
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const createAssignment = async (apiPrivate: AxiosInstance, payload: any) => {
  try {
    const { data } = await apiPrivate.post('/assignments', payload)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

export const deleteAssignment = async (apiPrivate: AxiosInstance, id: string) => {
  try {
    const { data } = await apiPrivate.delete(`/assignments/${id}`)
    return data
  } catch (error) {
    throw errorHandler(error)
  }
}

import { errorHandler } from '../utils/errorHandler'
import type { useApiPrivate } from '../composables/useApi'

export const fetchReportSummary = async (apiPrivate: ReturnType<typeof useApiPrivate>, params: any) => {
  try {
    const { data } = await apiPrivate.get('/reports/summary', { params })
    return data
  } catch (error) {
    throw errorHandler(error, true)
  }
}

export const fetchServicePdf = async (apiPrivate: ReturnType<typeof useApiPrivate>, params: any) => {
  try {
    const { data } = await apiPrivate.get('/reports/service/pdf', { params })
    return data
  } catch (error) {
    throw errorHandler(error, true)
  }
}

export const downloadIndividualExcelService = async (apiPrivate: ReturnType<typeof useApiPrivate>, params: any) => {
  try {
    const response = await apiPrivate.get('/reports/export/excel/individual', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    throw errorHandler(error, true)
  }
}

export const downloadServiceExcelService = async (apiPrivate: ReturnType<typeof useApiPrivate>, params: any) => {
  try {
    const response = await apiPrivate.get('/reports/export/excel', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    throw errorHandler(error, true)
  }
}

import { AxiosError } from 'axios'

export function errorHandler(error: unknown, silent: boolean = false) {
  if (error instanceof AxiosError) {
    if (!silent) {
      console.error('Axios error:', error.response?.data || error.message)
    }
    const data = error.response?.data || { message: error.message }
    // Preserve status code if available, useful for 409 Conflict handling
    if (typeof data === 'object' && data !== null && error.response) {
      ;(data as any).status = error.response.status
    }
    return data
  }
  if (!silent) {
    console.error('Unknown error:', error)
  }
  return { message: 'Error desconocido' }
}

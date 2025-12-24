import { describe, it, expect, vi } from 'vitest'
import { errorHandler } from './errorHandler'
import { AxiosError } from 'axios'

describe('errorHandler', () => {
  it('should handle AxiosError with response data', () => {
    const error = new AxiosError('Msg', 'CODE', undefined, undefined, {
      data: { message: 'Server Error' }
    } as any)

    // Spy on console.error to avoid polluting test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = errorHandler(error)

    expect(result).toEqual({ message: 'Server Error' })
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('should handle AxiosError without response data', () => {
    const error = new AxiosError('Network Error')

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = errorHandler(error)

    expect(result).toEqual({ message: 'Network Error' })
    consoleSpy.mockRestore()
  })

  it('should handle unknown error', () => {
    const error = new Error('Unknown')

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = errorHandler(error)

    expect(result).toEqual({ message: 'Error desconocido' })
    consoleSpy.mockRestore()
  })
})

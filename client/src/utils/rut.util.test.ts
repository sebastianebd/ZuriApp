import { describe, it, expect } from 'vitest'
import { formatRut, cleanRutForStorage } from './rut.util'

describe('RUT Utility', () => {
  describe('formatRut (Mascara Visual)', () => {
    it('should handle empty input', () => {
      expect(formatRut('')).toBe('')
    })

    it('should handle single digit', () => {
      expect(formatRut('1')).toBe('1')
    })

    it('should formatting basic RUT without dots', () => {
      expect(formatRut('12')).toBe('1-2')
      expect(formatRut('123')).toBe('12-3')
    })

    it('should add first dot', () => {
      // 1234 -> cuerpo 123, dv 4 -> 123-4
      expect(formatRut('1234')).toBe('123-4')
      expect(formatRut('12345')).toBe('1.234-5')
    })

    it('should format full RUT correctly', () => {
      expect(formatRut('123456789')).toBe('12.345.678-9')
    })

    it('should handle K digit', () => {
      expect(formatRut('12345678k')).toBe('12.345.678-K')
    })

    it('should clean invalid characters', () => {
      // 12345abc -> 12345 -> 1.234-5
      expect(formatRut('12.345.abc')).toBe('1.234-5')
      // A1B2C3 -> 123 -> 12-3
      expect(formatRut('A1B2C3')).toBe('12-3')
    })
  })

  describe('cleanRutForStorage', () => {
    it('should return strict format 12345678-9', () => {
      expect(cleanRutForStorage('12.345.678-9')).toBe('12345678-9')
    })

    it('should handle K', () => {
      expect(cleanRutForStorage('18.963.543-k')).toBe('18963543-K')
    })
  })
})

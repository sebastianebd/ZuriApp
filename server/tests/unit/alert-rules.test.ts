import { describe, it, expect } from 'vitest'
import { norm01Rule } from '../../services/alert-rules/norm-01.rule'
import { norm02Rule } from '../../services/alert-rules/norm-02.rule'
import { norm03Rule } from '../../services/alert-rules/norm-03.rule'
import { ops01Rule } from '../../services/alert-rules/ops-01.rule'
import { ops02Rule } from '../../services/alert-rules/ops-02.rule'

describe('Motor de Alertas - Reglas Puras en Memoria (TDD RED)', () => {
  const serviceId = 'srv-uci-1'
  const staffId = 'staff-enf-1'

  describe('NORM-01: Descanso mínimo 12h entre turnos consecutivos', () => {
    it('debería emitir alerta crítica si el descanso entre dos turnos es menor a 12 horas (ej: 11 horas)', async () => {
      // Turno 1: 08:00 a 20:00 (2026-10-01)
      // Turno 2: 07:00 a 16:00 (2026-10-02) -> Descanso: 11 horas
      const context: any = {
        staffId,
        serviceId,
        dateRange: { start: new Date('2026-10-01'), end: new Date('2026-10-03') },
        shifts: [
          {
            date: '2026-10-01',
            entry: '08:00',
            exit: '20:00',
            sigla: 'L',
            staffId,
            serviceId,
          },
          {
            date: '2026-10-02',
            entry: '07:00',
            exit: '16:00',
            sigla: 'D',
            staffId,
            serviceId,
          },
        ],
      }

      const alerts = await norm01Rule.evaluate(context)

      expect(alerts.length).toBe(1)
      expect(alerts[0].ruleId).toBe('NORM-01')
      expect(alerts[0].severity).toBe('critical')
      expect(alerts[0].message).toContain('Descanso insuficiente')
    })

    it('no debería emitir alerta si el descanso es igual o superior a 12 horas', async () => {
      // Turno 1: 08:00 a 20:00 (2026-10-01)
      // Turno 2: 08:00 a 17:00 (2026-10-02) -> Descanso: 12 horas exactas
      const context: any = {
        staffId,
        serviceId,
        dateRange: { start: new Date('2026-10-01'), end: new Date('2026-10-03') },
        shifts: [
          {
            date: '2026-10-01',
            entry: '08:00',
            exit: '20:00',
            sigla: 'L',
            staffId,
            serviceId,
          },
          {
            date: '2026-10-02',
            entry: '08:00',
            exit: '17:00',
            sigla: 'D',
            staffId,
            serviceId,
          },
        ],
      }

      const alerts = await norm01Rule.evaluate(context)
      expect(alerts.length).toBe(0)
    })
  })

  describe('NORM-02: Doble turno prohibido (24 horas ininterrumpidas)', () => {
    it('debería emitir alerta crítica si se detecta un turno Largo y Noche continuos en el mismo día', async () => {
      // Largo: 08:00 a 20:00 (2026-10-01)
      // Noche: 20:00 a 08:00 (2026-10-01) -> 24h continuo
      const context: any = {
        staffId,
        serviceId,
        dateRange: { start: new Date('2026-10-01'), end: new Date('2026-10-02') },
        shifts: [
          {
            date: '2026-10-01',
            entry: '08:00',
            exit: '20:00',
            sigla: 'L',
            staffId,
            serviceId,
          },
          {
            date: '2026-10-01',
            entry: '20:00',
            exit: '08:00',
            sigla: 'N',
            staffId,
            serviceId,
          },
        ],
      }

      const alerts = await norm02Rule.evaluate(context)

      expect(alerts.length).toBe(1)
      expect(alerts[0].ruleId).toBe('NORM-02')
      expect(alerts[0].severity).toBe('critical')
      expect(alerts[0].message).toContain('Doble turno')
    })
  })

  describe('NORM-03: Descanso post-noche insuficiente (< 24h)', () => {
    it('debería emitir alerta alta si tras una guardia nocturna reingresa antes de cumplir 24 horas de descanso', async () => {
      // Noche: entra 20:00 (2026-10-01), sale 08:00 (2026-10-02)
      // Reingreso: 20:00 (2026-10-02) -> Descanso: 12 horas (< 24h)
      const context: any = {
        staffId,
        serviceId,
        dateRange: { start: new Date('2026-10-01'), end: new Date('2026-10-03') },
        shifts: [
          {
            date: '2026-10-01',
            entry: '20:00',
            exit: '08:00',
            sigla: 'N',
            staffId,
            serviceId,
          },
          {
            date: '2026-10-02',
            entry: '20:00',
            exit: '08:00',
            sigla: 'N',
            staffId,
            serviceId,
          },
        ],
      }

      const alerts = await norm03Rule.evaluate(context)

      expect(alerts.length).toBe(1)
      expect(alerts[0].ruleId).toBe('NORM-03')
      expect(alerts[0].severity).toBe('high')
      expect(alerts[0].message).toContain('post-noche')
    })

    it('no debería emitir alerta si tras la salida de noche descansa 24 horas o más', async () => {
      // Noche: sale 08:00 (2026-10-02)
      // Próximo turno: 08:00 (2026-10-03) -> 24h exactas
      const context: any = {
        staffId,
        serviceId,
        dateRange: { start: new Date('2026-10-01'), end: new Date('2026-10-04') },
        shifts: [
          {
            date: '2026-10-01',
            entry: '20:00',
            exit: '08:00',
            sigla: 'N',
            staffId,
            serviceId,
          },
          {
            date: '2026-10-03',
            entry: '08:00',
            exit: '20:00',
            sigla: 'L',
            staffId,
            serviceId,
          },
        ],
      }

      const alerts = await norm03Rule.evaluate(context)
      expect(alerts.length).toBe(0)
    })
  })



  describe('OPS-01: Déficit de dotación mínima en ventana de cobertura', () => {
    it('debería emitir alerta media si la dotación presente en un slot es menor a la dotación mínima configurada', async () => {
      const context: any = {
        serviceId,
        dateRange: { start: new Date('2026-10-05'), end: new Date('2026-10-05') },
        dotacionMinima: [
          {
            positionId: 'pos-enfermera',
            positionName: 'Enfermera',
            minimo_dia: 2,
            minimo_noche: 0,
          },
        ],
        dailyPresent: [
          {
            date: '2026-10-05',
            slot: 'DIA',
            positionId: 'pos-enfermera',
            count: 1, // Requiere 2, hay 1 presente
          },
        ],
      }

      const alerts = await ops01Rule.evaluate(context)

      expect(alerts.length).toBe(1)
      expect(alerts[0].ruleId).toBe('OPS-01')
      expect(alerts[0].severity).toBe('medium')
      expect(alerts[0].shiftSlot).toBe('DIA')
      expect(alerts[0].positionId).toBe('pos-enfermera')
      expect(alerts[0].context.deficit).toBe(1)
    })
  })

  describe('OPS-02: Noches consecutivas acumuladas (3 o más noches seguidas)', () => {
    it('debería emitir alerta media si un funcionario acumula 3 turnos nocturnos consecutivos', async () => {
      const context: any = {
        staffId,
        serviceId,
        dateRange: { start: new Date('2026-10-01'), end: new Date('2026-10-04') },
        shifts: [
          { date: '2026-10-01', entry: '20:00', exit: '08:00', sigla: 'N', isNight: true, staffId, serviceId },
          { date: '2026-10-02', entry: '20:00', exit: '08:00', sigla: 'N', isNight: true, staffId, serviceId },
          { date: '2026-10-03', entry: '20:00', exit: '08:00', sigla: 'N', isNight: true, staffId, serviceId },
        ],
      }

      const alerts = await ops02Rule.evaluate(context)

      expect(alerts.length).toBe(1)
      expect(alerts[0].ruleId).toBe('OPS-02')
      expect(alerts[0].severity).toBe('medium')
      expect(alerts[0].context.consecutiveNights).toBe(3)
    })

    it('no debería emitir alerta con solo 2 noches consecutivas', async () => {
      const context: any = {
        staffId,
        serviceId,
        dateRange: { start: new Date('2026-10-01'), end: new Date('2026-10-03') },
        shifts: [
          { date: '2026-10-01', entry: '20:00', exit: '08:00', sigla: 'N', isNight: true, staffId, serviceId },
          { date: '2026-10-02', entry: '20:00', exit: '08:00', sigla: 'N', isNight: true, staffId, serviceId },
        ],
      }

      const alerts = await ops02Rule.evaluate(context)
      expect(alerts.length).toBe(0)
    })
  })
})

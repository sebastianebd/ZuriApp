import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import alertService from '../../services/alert.service';
import Alert from '../../models/alert.model';
import Service from '../../models/service.model';
import { TurnAssignmentModel } from '../../models/turn-assignment.model';
import Replacement from '../../models/replacement.model';
import { ShiftExceptionModel } from '../../models/shift-exception.model';
import { TurnSigla } from '../../models/turn-sigla.model';
import socketService from '../../services/socket.service';

vi.mock('../../models/alert.model', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../../models/service.model', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../models/turn-assignment.model', () => ({
  TurnAssignmentModel: {
    find: vi.fn(),
  },
}));

vi.mock('../../models/replacement.model', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../models/shift-exception.model', () => ({
  ShiftExceptionModel: {
    find: vi.fn(),
  },
}));

vi.mock('../../models/turn-sigla.model', () => ({
  TurnSigla: {
    find: vi.fn(),
  },
}));

vi.mock('../../services/socket.service', () => ({
  default: {
    emitAlertNew: vi.fn(),
    emitAlertAcknowledged: vi.fn(),
    emitAlertResolved: vi.fn(),
  },
}));

describe('AlertService - Lógica del Motor de Alertas (TDD)', () => {
  const staffId = 'staff-123';
  const serviceId = 'srv-uci-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('evaluateForStaff (Nivel 1: Tiempo Real)', () => {
    it('debería detectar infracción NORM-01, crear alerta y emitir WebSocket alert:new', async () => {
      // Mock de siglas
      (TurnSigla.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { sigla: 'L', start: '08:00', end: '20:00', hours: 12 },
          { sigla: 'D', start: '07:00', end: '16:00', hours: 9 },
        ]),
      });

      // Mock de asignaciones con 2 turnos que infringen descanso (11 horas)
      (TurnAssignmentModel.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            staffId,
            service: serviceId,
            start_date: new Date('2026-10-01T00:00:00.000Z'),
            snapshot_secuencia: [
              { dia: 1, turno_entrada: '08:00', turno_salida: '20:00', sigla: 'L', es_libre: false },
              { dia: 2, turno_entrada: '07:00', turno_salida: '16:00', sigla: 'D', es_libre: false },
            ],
          },
        ]),
      });

      (Replacement.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      });

      (ShiftExceptionModel.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      });

      (Alert.findOne as any).mockResolvedValue(null);
      (Alert.create as any).mockImplementation((data: any) => Promise.resolve({ _id: 'alert-new-1', ...data }));

      const candidates = await alertService.evaluateForStaff(staffId, serviceId, new Date('2026-10-01'));

      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates[0].ruleId).toBe('NORM-01');
      expect(Alert.create).toHaveBeenCalled();
      expect(socketService.emitAlertNew).toHaveBeenCalledWith(serviceId, expect.anything());
    });

    it('idempotencia: no debería duplicar alerta si ya existe una activa para el mismo funcionario, regla y fecha', async () => {
      (TurnSigla.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { sigla: 'L', start: '08:00', end: '20:00', hours: 12 },
          { sigla: 'D', start: '07:00', end: '16:00', hours: 9 },
        ]),
      });

      (TurnAssignmentModel.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            staffId,
            service: serviceId,
            start_date: new Date('2026-10-01T00:00:00.000Z'),
            snapshot_secuencia: [
              { dia: 1, turno_entrada: '08:00', turno_salida: '20:00', sigla: 'L', es_libre: false },
              { dia: 2, turno_entrada: '07:00', turno_salida: '16:00', sigla: 'D', es_libre: false },
            ],
          },
        ]),
      });

      (Replacement.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (ShiftExceptionModel.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      // Ya existe alerta activa
      (Alert.findOne as any).mockResolvedValue({ _id: 'existing-alert', status: 'active' });

      await alertService.evaluateForStaff(staffId, serviceId, new Date('2026-10-01'));

      expect(Alert.create).not.toHaveBeenCalled();
      expect(socketService.emitAlertNew).not.toHaveBeenCalled();
    });

    it('jerarquía de alertas: NORM-02 debe suprimir NORM-01 y NORM-03 ante un doble turno continuo (24h de corrido)', async () => {
      (TurnSigla.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { sigla: 'N', start: '20:00', end: '08:00', hours: 12 },
          { sigla: 'L', start: '08:00', end: '20:00', hours: 12 },
        ]),
      });

      const assignId = new mongoose.Types.ObjectId();
      // Noche el 2026-10-01 (20:00 a 08:00) y Largo el 2026-10-02 (08:00 a 20:00) -> 24h continuas
      (TurnAssignmentModel.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: assignId,
            staffId,
            service: serviceId,
            start_date: new Date('2026-10-01T00:00:00.000Z'),
            snapshot_secuencia: [
              { dia: 1, turno_entrada: '20:00', turno_salida: '08:00', sigla: 'N', es_libre: false },
              { dia: 2, turno_entrada: '08:00', turno_salida: '20:00', sigla: 'L', es_libre: false },
              { dia: 3, sigla: 'X', es_libre: true },
              { dia: 4, sigla: 'X', es_libre: true },
            ],
          },
        ]),
      });

      (Replacement.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (ShiftExceptionModel.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Alert.findOne as any).mockResolvedValue(null);
      (Alert.create as any).mockImplementation((data: any) => Promise.resolve({ _id: 'alert-mock', ...data }));

      const candidates = await alertService.evaluateForStaff(staffId, serviceId, new Date('2026-10-01'));

      // Solo debe existir NORM-02 (no debe haber ráfaga con NORM-01 ni NORM-03)
      const ruleIds = candidates.map((c) => c.ruleId);
      expect(ruleIds).toContain('NORM-02');
      expect(ruleIds).not.toContain('NORM-01');
      expect(ruleIds).not.toContain('NORM-03');
      expect(candidates.length).toBe(1);
    });

    it('jerarquía de alertas: NORM-03 debe suprimir NORM-01 cuando la infracción proviene de salida nocturna', async () => {
      (TurnSigla.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { sigla: 'N', start: '20:00', end: '08:00', hours: 12 },
          { sigla: 'D', start: '18:00', end: '23:00', hours: 5 },
        ]),
      });

      const assignId = new mongoose.Types.ObjectId();
      // Noche el 2026-10-01 (sale a las 08:00) y entra a las 18:00 (10 horas de descanso)
      (TurnAssignmentModel.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: assignId,
            staffId,
            service: serviceId,
            start_date: new Date('2026-10-01T00:00:00.000Z'),
            snapshot_secuencia: [
              { dia: 1, turno_entrada: '20:00', turno_salida: '08:00', sigla: 'N', es_libre: false },
              { dia: 2, turno_entrada: '18:00', turno_salida: '23:00', sigla: 'D', es_libre: false },
              { dia: 3, sigla: 'X', es_libre: true },
              { dia: 4, sigla: 'X', es_libre: true },
            ],
          },
        ]),
      });

      (Replacement.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (ShiftExceptionModel.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Alert.findOne as any).mockResolvedValue(null);
      (Alert.create as any).mockImplementation((data: any) => Promise.resolve({ _id: 'alert-mock', ...data }));

      const candidates = await alertService.evaluateForStaff(staffId, serviceId, new Date('2026-10-01'));

      const ruleIds = candidates.map((c) => c.ruleId);
      expect(ruleIds).toContain('NORM-03');
      expect(ruleIds).not.toContain('NORM-01');
      expect(candidates.length).toBe(1);
    });

    it('auto-resolución: debería auto-resolver alerta normativa activa previa si el turno se corrige o restaura', async () => {
      (TurnSigla.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { sigla: 'L', start: '08:00', end: '20:00', hours: 12 },
          { sigla: 'X', start: '08:00', end: '20:00', hours: 0 },
        ]),
      });

      const assignId = new mongoose.Types.ObjectId();
      // Turno regular normal con descansos legales: L X (no infringe ninguna norma)
      (TurnAssignmentModel.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: assignId,
            staffId,
            service: serviceId,
            start_date: new Date('2026-10-01T00:00:00.000Z'),
            snapshot_secuencia: [
              { dia: 1, turno_entrada: '08:00', turno_salida: '20:00', sigla: 'L', es_libre: false },
              { dia: 2, sigla: 'X', es_libre: true },
            ],
          },
        ]),
      });

      (Replacement.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (ShiftExceptionModel.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      // Había una alerta activa previa NORM-02 en esa semana (ej. de una excepción previa que fue borrada)
      const oldActiveAlert: any = {
        _id: 'alert-norm-old',
        ruleId: 'NORM-02',
        staffId,
        serviceId,
        date: new Date('2026-10-01T20:00:00.000Z'),
        status: 'active',
        save: vi.fn().mockResolvedValue(true),
      };

      (Alert.find as any).mockResolvedValue([oldActiveAlert]);
      (Alert.findOne as any).mockResolvedValue(null);

      const candidates = await alertService.evaluateForStaff(staffId, serviceId, new Date('2026-10-01'));

      expect(candidates.length).toBe(0);
      expect(oldActiveAlert.status).toBe('resolved');
      expect(oldActiveAlert.resolutionNote).toContain('Auto-resuelto: infracción corregida');
      expect(socketService.emitAlertResolved).toHaveBeenCalledWith(serviceId, 'alert-norm-old');
    });
  });

  describe('evaluateAllDaily (Nivel 2: Auto-resolución OPS-01)', () => {
    it('debería auto-resolver alerta OPS-01 previa cuando el puesto ha sido cubierto', async () => {
      const positionId = 'pos-enf-1';
      const mockService = {
        _id: serviceId,
        nombre: 'UCI Adultos',
        dotacion_minima: [
          {
            positionId: { _id: positionId, name: 'Enfermera' },
            minimo_dia: 1,
            minimo_noche: 0,
          },
        ],
      };

      (Service.find as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue([mockService]),
      });

      // El puesto está cubierto con una asignación activa diurna
      (TurnAssignmentModel.find as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue([
          {
            staffId: { _id: 'staff-1', positionId },
            service: serviceId,
            start_date: new Date(),
            snapshot_secuencia: [
              { dia: 1, turno_entrada: '08:00', turno_salida: '20:00', sigla: 'L', es_libre: false },
            ],
          },
        ]),
      });

      (Replacement.find as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      });

      // Existía una alerta previa OPS-01 activa
      const existingOpsAlert: any = {
        _id: 'ops-alert-old',
        ruleId: 'OPS-01',
        serviceId,
        shiftSlot: 'DIA',
        positionId,
        date: new Date(),
        status: 'active',
        save: vi.fn().mockResolvedValue(true),
      };

      (Alert.find as any).mockResolvedValue([existingOpsAlert]);

      const result = await alertService.evaluateAllDaily();

      expect(result.autoResolved).toBeGreaterThanOrEqual(1);
      expect(existingOpsAlert.status).toBe('resolved');
      expect(existingOpsAlert.resolutionNote).toBe('Auto-resuelto: dotación cubierta');
      expect(socketService.emitAlertResolved).toHaveBeenCalledWith(serviceId, 'ops-alert-old');
    });
  });
});

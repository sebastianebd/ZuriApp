import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvailabilityService } from '../../services/availability.service';
import ReplacementOffer from '../../models/replacement-offer.model';
import Replacement from '../../models/replacement.model';
import Staff from '../../models/staff.model';
import ShiftConfirmation from '../../models/shift-confirmation.model';
import TurnAssignment from '../../models/turn-assignment.model';

vi.mock('../../models/replacement-offer.model', () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock('../../models/replacement.model', () => ({
  default: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../../models/staff.model', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('../../models/shift-confirmation.model', () => ({
  default: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../../models/turn-assignment.model', () => ({
  default: {
    find: vi.fn(),
  },
}));

describe('AvailabilityService - Motor de Scoring y Búsqueda Activa (TDD RED)', () => {
  const mockServiceId = '507f1f77bcf86cd799439001';
  const mockPositionId = '507f1f77bcf86cd799439002';
  const mockOfferId = '507f1f77bcf86cd799439003';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scoreOfferApplicants - Rankeo de postulantes registrados', () => {
    it('debe ordenar a los postulantes por mayor puntuación y calcular el breakdown detallado', async () => {
      const mockOffer = {
        _id: mockOfferId,
        serviceId: mockServiceId,
        positionId: mockPositionId,
        tipo_turno: '4TO_TURNO',
        fecha_inicio: new Date('2026-10-10T08:00:00.000Z'),
        fecha_termino: new Date('2026-10-10T20:00:00.000Z'),
        status: 'open',
        applicants: [
          { staffId: 'staff_1', appliedAt: new Date(), status: 'pending' },
          { staffId: 'staff_2', appliedAt: new Date(), status: 'pending' },
        ],
      };

      const mockStaff1 = {
        _id: 'staff_1',
        rut: '11.111.111-1',
        firstName: 'Carlos',
        lastName: 'Pérez',
        phone: '+56911111111',
        positionId: { _id: mockPositionId, name: 'Enfermero/a Clínico/a' },
        isActive: true,
        contractType: 'HONORARIO',
      };

      const mockStaff2 = {
        _id: 'staff_2',
        rut: '22.222.222-2',
        firstName: 'Juan',
        lastName: 'Soto',
        phone: '+56922222222',
        positionId: { _id: mockPositionId, name: 'Enfermero/a Clínico/a' },
        isActive: true,
        contractType: 'HONORARIO',
      };

      (ReplacementOffer.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockOffer),
      });

      // Staff lookups
      (Staff.find as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue([mockStaff1, mockStaff2]),
      });

      // Reemplazos previos en el servicio:
      // staff_1 tiene 3 reemplazos previos en mockServiceId (+30 pts)
      // staff_2 tiene 0
      (Replacement.find as any).mockImplementation((query: any) => {
        if (query.id_entrante === 'staff_1') {
          return Promise.resolve([
            { servicio: mockServiceId, fecha_inicio: new Date('2026-09-01'), fecha_termino: new Date('2026-09-02'), status: 'activo' },
            { servicio: mockServiceId, fecha_inicio: new Date('2026-09-10'), fecha_termino: new Date('2026-09-11'), status: 'activo' },
            { servicio: mockServiceId, fecha_inicio: new Date('2026-09-20'), fecha_termino: new Date('2026-09-21'), status: 'activo' },
          ]);
        }
        return Promise.resolve([]);
      });

      // No turnos asignados colisionantes
      (TurnAssignment.find as any).mockResolvedValue([]);

      // Avisos de indisponibilidad: staff_1 no tiene (cleanRecord = true), staff_2 tiene 1
      (ShiftConfirmation.find as any).mockImplementation((query: any) => {
        if (query.staffId === 'staff_2' && query.status === 'unavailable') {
          return Promise.resolve([{ _id: 'sc1', status: 'unavailable' }]);
        }
        return Promise.resolve([]);
      });

      const results = await AvailabilityService.scoreOfferApplicants(mockOfferId);

      expect(results).toHaveLength(2);
      expect(results[0].staffId).toBe('staff_1');
      expect(results[0].fullName).toBe('Carlos Pérez');
      expect(results[0].score).toBeGreaterThan(results[1].score);
      expect(results[0].breakdown.previousReplacements).toBe(3);
      expect(results[0].breakdown.cleanRecord).toBe(true);
      expect(results[1].breakdown.cleanRecord).toBe(false);
    });

    it('descarta candidatos con incompatibilidad de cargo o inactivos', async () => {
      const mockOffer = {
        _id: mockOfferId,
        serviceId: mockServiceId,
        positionId: mockPositionId,
        tipo_turno: '4TO_TURNO',
        fecha_inicio: new Date('2026-10-10T08:00:00.000Z'),
        fecha_termino: new Date('2026-10-10T20:00:00.000Z'),
        status: 'open',
        applicants: [
          { staffId: 'staff_inactive', appliedAt: new Date(), status: 'pending' },
        ],
      };

      const mockInactiveStaff = {
        _id: 'staff_inactive',
        rut: '33.333.333-3',
        firstName: 'Pedro',
        lastName: 'Inactivo',
        phone: '+56933333333',
        positionId: { _id: mockPositionId, name: 'Enfermero/a Clínico/a' },
        isActive: false,
        contractType: 'HONORARIO',
      };

      (ReplacementOffer.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockOffer),
      });
      (Staff.find as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue([mockInactiveStaff]),
      });

      const results = await AvailabilityService.scoreOfferApplicants(mockOfferId);
      expect(results).toHaveLength(0);
    });
  });

  describe('getTopEligibleCandidates - Búsqueda Activa (Top 10 de contingencia)', () => {
    it('retorna hasta 10 candidatos ordenados por puntaje incluyendo teléfono directo', async () => {
      // Simulamos 15 honorarios con el mismo cargo
      const mockStaffList = Array.from({ length: 15 }, (_, i) => ({
        _id: `staff_h_${i + 1}`,
        rut: `1${i}.000.000-0`,
        firstName: `Funcionario`,
        lastName: `Numero ${i + 1}`,
        phone: `+569000000${i + 1}`,
        positionId: { _id: mockPositionId, name: 'Técnico en Enfermería' },
        isActive: true,
        isDeleted: false,
        contractType: 'HONORARIO',
      }));

      (Staff.find as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStaffList),
      });

      (Replacement.find as any).mockResolvedValue([]);
      (TurnAssignment.find as any).mockResolvedValue([]);
      (ShiftConfirmation.find as any).mockResolvedValue([]);

      const dateStart = new Date('2026-10-15T08:00:00.000Z');
      const dateEnd = new Date('2026-10-15T20:00:00.000Z');

      const results = await AvailabilityService.getTopEligibleCandidates(
        mockServiceId,
        mockPositionId,
        dateStart,
        dateEnd
      );

      expect(results.length).toBeLessThanOrEqual(10);
      expect(results[0]).toHaveProperty('phone');
      expect(results[0].phone).toBeTruthy();
      expect(results[0]).toHaveProperty('score');
      expect(results[0]).toHaveProperty('breakdown');
    });

    it('descarta candidatos que violen descanso NORM-01 (<12h) con turno previo', async () => {
      const mockStaffCandidate = {
        _id: 'staff_conflict',
        rut: '44.444.444-4',
        firstName: 'Ana',
        lastName: 'Conflicto',
        phone: '+56944444444',
        positionId: { _id: mockPositionId, name: 'Técnico en Enfermería' },
        isActive: true,
        isDeleted: false,
        contractType: 'HONORARIO',
      };

      (Staff.find as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue([mockStaffCandidate]),
      });

      // Turno previo que finaliza a las 00:00 del mismo día del inicio de la oferta (08:00) -> descanso de 8 horas (<12h)
      (Replacement.find as any).mockResolvedValue([
        {
          id_entrante: 'staff_conflict',
          fecha_inicio: new Date('2026-10-14T12:00:00.000Z'),
          fecha_termino: new Date('2026-10-15T00:00:00.000Z'),
          status: 'activo',
        },
      ]);
      (TurnAssignment.find as any).mockResolvedValue([]);
      (ShiftConfirmation.find as any).mockResolvedValue([]);

      const dateStart = new Date('2026-10-15T08:00:00.000Z');
      const dateEnd = new Date('2026-10-15T20:00:00.000Z');

      const results = await AvailabilityService.getTopEligibleCandidates(
        mockServiceId,
        mockPositionId,
        dateStart,
        dateEnd
      );

      expect(results).toHaveLength(0);
    });
  });

  describe('validateCompliance - Pre-validación normativa en memoria', () => {
    it('detecta colisión exacta de horarios', async () => {
      (Replacement.find as any).mockResolvedValue([
        {
          id_entrante: 'staff_colision',
          fecha_inicio: new Date('2026-10-15T08:00:00.000Z'),
          fecha_termino: new Date('2026-10-15T20:00:00.000Z'),
          status: 'activo',
        },
      ]);
      (TurnAssignment.find as any).mockResolvedValue([]);

      const validation = await AvailabilityService.validateCompliance(
        'staff_colision',
        new Date('2026-10-15T12:00:00.000Z'),
        new Date('2026-10-15T18:00:00.000Z'),
        '4TO_TURNO'
      );

      expect(validation.valid).toBe(false);
      expect(validation.violations).toContain('COLLISION');
    });

    it('detecta doble turno continuo de 24 horas (NORM-02)', async () => {
      // Turno saliente finaliza exactamente cuando inicia el nuevo (0 minutos de descanso)
      (Replacement.find as any).mockResolvedValue([
        {
          id_entrante: 'staff_double_shift',
          fecha_inicio: new Date('2026-10-14T20:00:00.000Z'),
          fecha_termino: new Date('2026-10-15T08:00:00.000Z'),
          status: 'activo',
        },
      ]);
      (TurnAssignment.find as any).mockResolvedValue([]);

      const validation = await AvailabilityService.validateCompliance(
        'staff_double_shift',
        new Date('2026-10-15T08:00:00.000Z'),
        new Date('2026-10-15T20:00:00.000Z'),
        '4TO_TURNO'
      );

      expect(validation.valid).toBe(false);
      expect(validation.violations).toContain('NORM-02');
    });
  });
});

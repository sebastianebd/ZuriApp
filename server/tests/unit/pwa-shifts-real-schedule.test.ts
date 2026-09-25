import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PwaShiftsService } from '../../services/pwa-shifts.service';
import TurnAssignment from '../../models/turn-assignment.model';
import Replacement from '../../models/replacement.model';
import ShiftConfirmation from '../../models/shift-confirmation.model';
import Period from '../../models/period.model';

vi.mock('../../models/period.model', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('../../models/turn-assignment.model', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../models/replacement.model', () => ({
  default: {
    find: vi.fn(),
  },
  REPLACEMENT_AUDIT_FIELDS: [],
}));

import Staff from '../../models/staff.model';

vi.mock('../../models/staff.model', () => ({
  default: {
    findById: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    }),
  },
  STAFF_AUDIT_FIELDS: [],
}));

vi.mock('../../models/shift-confirmation.model', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../models/turn-type.model', () => ({
  default: {
    find: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          nombre: 'CUARTO TURNO',
          secuencia: [
            { dia: 1, sigla: 'L', turno_entrada: '08:00', turno_salida: '20:00', es_libre: false },
            { dia: 2, sigla: 'N', turno_entrada: '20:00', turno_salida: '08:00', es_libre: false },
            { dia: 3, sigla: 'X', turno_entrada: null, turno_salida: null, es_libre: true },
            { dia: 4, sigla: 'X', turno_entrada: null, turno_salida: null, es_libre: true },
          ],
        },
      ]),
    }),
    findOne: vi.fn(),
  },
  TURN_TYPE_AUDIT_FIELDS: [],
}));

describe('PwaShiftsService - Turnos Reales vs Sin Proyección Sintética Falsa (TDD RED)', () => {
  const mockStaffId = '507f1f77bcf86cd799439011';
  const mockServiceId = '507f1f77bcf86cd799439022';

  beforeEach(() => {
    vi.clearAllMocks();
    (Period.findOne as any).mockResolvedValue({ month: 9, year: 2026, status: 'OPEN' });
    (ShiftConfirmation.find as any).mockResolvedValue([]);
  });

  it('NO debe proyectar turnos ficticios en meses futuros sin contratos ni asignaciones (ej. Febrero 2027)', async () => {
    // Simulamos que el funcionario no tiene ni turnos de planta ni reemplazos en Febrero 2027
    (TurnAssignment.find as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue([]),
    });
    (Replacement.find as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue([]),
    });

    const result = await PwaShiftsService.getShifts(mockStaffId, 2, 2027);

    expect(result.period).toEqual({ month: 2, year: 2027 });
    expect(result.replacementContracts).toHaveLength(0);
    expect(result.shifts).toHaveLength(28);

    // Ningún día de Febrero 2027 debe tener turno laborable ni sigla inventada
    const workShifts = result.shifts.filter((s) => s.isWorkDay);
    expect(workShifts).toHaveLength(0);

    const replacementShifts = result.shifts.filter((s) => s.isReplacement);
    expect(replacementShifts).toHaveLength(0);

    // Todas las siglas deben estar vacías
    const daysWithSigla = result.shifts.filter((s) => s.sigla && s.sigla !== '' && s.sigla !== '-');
    expect(daysWithSigla).toHaveLength(0);
  });

  it('debe reflejar exactamente los turnos del reemplazo (del 21 al 30 de Septiembre 2026) y dejar vacíos los días 1 al 20', async () => {
    // Simulamos el caso de Rumina Garcia:
    // Sin asignación de planta
    (TurnAssignment.find as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue([]),
    });

    // Reemplazo del 21 al 30 de Septiembre de 2026 en Farmacia
    // Secuencia: L, L, N, N, X, X, L, L, N, N (4to turno rotativo comenzando en L)
    const mockReplacement = {
      _id: 'rep-rumina-1',
      id_negocio: 'REP-2026-FARM-01',
      id_entrante: mockStaffId,
      id_saliente: '507f1f77bcf86cd799439099',
      servicio: { _id: mockServiceId, nombre: 'FARMACIA' },
      fecha_inicio: new Date(2026, 8, 21), // 2026-09-21
      fecha_termino: new Date(2026, 8, 30), // 2026-09-30
      tipo_turno: '4TO_TURNO',
      snapshot_secuencia: [
        { dia: 1, sigla: 'L', turno_entrada: '08:00', turno_salida: '20:00', es_libre: false },
        { dia: 2, sigla: 'L', turno_entrada: '08:00', turno_salida: '20:00', es_libre: false },
        { dia: 3, sigla: 'N', turno_entrada: '20:00', turno_salida: '08:00', es_libre: false },
        { dia: 4, sigla: 'N', turno_entrada: '20:00', turno_salida: '08:00', es_libre: false },
        { dia: 5, sigla: 'X', turno_entrada: null, turno_salida: null, es_libre: true },
        { dia: 6, sigla: 'X', turno_entrada: null, turno_salida: null, es_libre: true },
        { dia: 7, sigla: 'L', turno_entrada: '08:00', turno_salida: '20:00', es_libre: false },
        { dia: 8, sigla: 'L', turno_entrada: '08:00', turno_salida: '20:00', es_libre: false },
        { dia: 9, sigla: 'N', turno_entrada: '20:00', turno_salida: '08:00', es_libre: false },
        { dia: 10, sigla: 'N', turno_entrada: '20:00', turno_salida: '08:00', es_libre: false },
      ],
      status: 'activo',
    };

    (Replacement.find as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue([mockReplacement]),
    });

    const result = await PwaShiftsService.getShifts(mockStaffId, 9, 2026);

    expect(result.shifts).toHaveLength(30);

    // 1. Días 1 al 20: NO tienen turnos programados ni reemplazos
    for (let day = 1; day <= 20; day++) {
      const shift = result.shifts[day - 1];
      expect(shift.isWorkDay).toBe(false);
      expect(shift.isReplacement).toBe(false);
      expect(shift.sigla).toBe('');
    }

    // 2. Días 21 al 30: deben coincidir con la secuencia del reemplazo
    const repDays = result.shifts.slice(20, 30);
    expect(repDays).toHaveLength(10);

    // Día 21: Largo (L)
    expect(repDays[0].date).toBe('2026-09-21');
    expect(repDays[0].sigla).toBe('L');
    expect(repDays[0].isWorkDay).toBe(true);
    expect(repDays[0].isReplacement).toBe(true);
    expect(repDays[0].serviceName).toBe('FARMACIA');
    expect(repDays[0].entryTime).toBe('08:00');
    expect(repDays[0].exitTime).toBe('20:00');

    // Día 22: Largo (L)
    expect(repDays[1].date).toBe('2026-09-22');
    expect(repDays[1].sigla).toBe('L');
    expect(repDays[1].isWorkDay).toBe(true);
    expect(repDays[1].isReplacement).toBe(true);

    // Día 23: Noche (N)
    expect(repDays[2].date).toBe('2026-09-23');
    expect(repDays[2].sigla).toBe('N');
    expect(repDays[2].isWorkDay).toBe(true);

    // Día 24: Noche (N)
    expect(repDays[3].date).toBe('2026-09-24');
    expect(repDays[3].sigla).toBe('N');
    expect(repDays[3].isWorkDay).toBe(true);

    // Días 25 y 26: Libres (X) dentro del contrato
    expect(repDays[4].date).toBe('2026-09-25');
    expect(repDays[4].sigla).toBe('X');
    expect(repDays[4].isWorkDay).toBe(false);
    expect(repDays[4].isReplacement).toBe(true);

    expect(repDays[5].date).toBe('2026-09-26');
    expect(repDays[5].sigla).toBe('X');
    expect(repDays[5].isWorkDay).toBe(false);

    // Días 27 y 28: Largo (L)
    expect(repDays[6].sigla).toBe('L');
    expect(repDays[6].isWorkDay).toBe(true);
    expect(repDays[7].sigla).toBe('L');
    expect(repDays[7].isWorkDay).toBe(true);

    // Días 29 y 30: Noche (N)
    expect(repDays[8].sigla).toBe('N');
    expect(repDays[8].isWorkDay).toBe(true);
    expect(repDays[9].sigla).toBe('N');
    expect(repDays[9].isWorkDay).toBe(true);

    // Total de turnos trabajados en el mes: exactamente 8 (4 Largo + 4 Noche = 96 horas)
    const totalWorking = result.shifts.filter((s) => s.isWorkDay);
    expect(totalWorking).toHaveLength(8);
  });

  it('debe calcular correctamente getHomeSummary con próximo turno Noche (20:00 - 08:00), 96 horas totales y agenda semanal real para el 24 de Septiembre', async () => {
    // Fijamos fecha actual al 24 de Septiembre de 2026
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 24, 10, 0, 0));

    (TurnAssignment.find as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue([]),
    });

    const mockReplacement = {
      _id: 'rep-rumina-1',
      id_negocio: 'REP-2026-FARM-01',
      id_entrante: mockStaffId,
      id_saliente: '507f1f77bcf86cd799439099',
      servicio: { _id: mockServiceId, nombre: 'FARMACIA' },
      fecha_inicio: new Date(2026, 8, 21),
      fecha_termino: new Date(2026, 8, 30),
      tipo_turno: '4TO_TURNO',
      snapshot_secuencia: [
        { dia: 1, sigla: 'L', turno_entrada: '08:00', turno_salida: '20:00', es_libre: false },
        { dia: 2, sigla: 'L', turno_entrada: '08:00', turno_salida: '20:00', es_libre: false },
        { dia: 3, sigla: 'N', turno_entrada: '20:00', turno_salida: '08:00', es_libre: false },
        { dia: 4, sigla: 'N', turno_entrada: '20:00', turno_salida: '08:00', es_libre: false },
        { dia: 5, sigla: 'X', turno_entrada: null, turno_salida: null, es_libre: true },
        { dia: 6, sigla: 'X', turno_entrada: null, turno_salida: null, es_libre: true },
        { dia: 7, sigla: 'L', turno_entrada: '08:00', turno_salida: '20:00', es_libre: false },
        { dia: 8, sigla: 'L', turno_entrada: '08:00', turno_salida: '20:00', es_libre: false },
        { dia: 9, sigla: 'N', turno_entrada: '20:00', turno_salida: '08:00', es_libre: false },
        { dia: 10, sigla: 'N', turno_entrada: '20:00', turno_salida: '08:00', es_libre: false },
      ],
      status: 'activo',
    };

    (Replacement.find as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue([mockReplacement]),
    });

    const homeData = await PwaShiftsService.getHomeSummary(mockStaffId);

    // 1. Próximo Turno del 24 de Septiembre debe ser NOCHE (20:00 - 08:00)
    expect(homeData.nextShift).not.toBeNull();
    expect(homeData.nextShift?.date).toBe('2026-09-24');
    expect(homeData.nextShift?.sigla).toBe('N');
    expect(homeData.nextShift?.entryTime).toBe('20:00');
    expect(homeData.nextShift?.exitTime).toBe('08:00');
    expect(homeData.nextShift?.serviceName).toBe('FARMACIA');

    // 2. KPIs del mes deben ser exactamente 96 horas totales (48 diurnas + 48 nocturnas)
    expect(homeData.kpis.totalHours).toBe(96);
    expect(homeData.kpis.dayHours).toBe(48);
    expect(homeData.kpis.nightHours).toBe(48);

    // 3. Agenda de los próximos 7 días debe coincidir con el rol real:
    // 24: Noche, 25: Libre, 26: Libre, 27: Largo, 28: Largo, 29: Noche, 30: Noche
    expect(homeData.weeklyAgenda).toHaveLength(7);
    expect(homeData.weeklyAgenda[0].sigla).toBe('N');
    expect(homeData.weeklyAgenda[0].isWorkDay).toBe(true);
    expect(homeData.weeklyAgenda[0].shiftName).toContain('Noche');

    expect(homeData.weeklyAgenda[1].sigla).toBe('X');
    expect(homeData.weeklyAgenda[1].isWorkDay).toBe(false);

    expect(homeData.weeklyAgenda[2].sigla).toBe('X');
    expect(homeData.weeklyAgenda[2].isWorkDay).toBe(false);

    expect(homeData.weeklyAgenda[3].sigla).toBe('L');
    expect(homeData.weeklyAgenda[3].isWorkDay).toBe(true);

    expect(homeData.weeklyAgenda[4].sigla).toBe('L');
    expect(homeData.weeklyAgenda[4].isWorkDay).toBe(true);

    expect(homeData.weeklyAgenda[5].sigla).toBe('N');
    expect(homeData.weeklyAgenda[5].isWorkDay).toBe(true);

    expect(homeData.weeklyAgenda[6].sigla).toBe('N');
    expect(homeData.weeklyAgenda[6].isWorkDay).toBe(true);

    vi.useRealTimers();
  });

  it('debe resolver dinámicamente TurnType cuando snapshot_secuencia esté vacío y NUNCA asignar "CUARTO TURNO" como sigla', async () => {
    (TurnAssignment.find as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue([]),
    });

    // Simulamos un reemplazo adjudicado donde snapshot_secuencia quedó vacío o tipo_turno es CUARTO TURNO
    const mockReplacementEmptySeq = {
      _id: 'rep-oct-1',
      id_negocio: 'REP-2026-OCT-01',
      id_entrante: mockStaffId,
      servicio: { _id: mockServiceId, nombre: 'CIRUGIA' },
      fecha_inicio: new Date('2026-10-04T00:00:00.000Z'),
      fecha_termino: new Date('2026-10-10T00:00:00.000Z'),
      tipo_turno: 'CUARTO TURNO',
      snapshot_secuencia: [], // Secuencia vacía (como en el bug reportado)
      status: 'EN CURSO',
    };

    (Replacement.find as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue([mockReplacementEmptySeq]),
    });

    const result = await PwaShiftsService.getShifts(mockStaffId, 10, 2026);

    // Días 1 al 3 deben estar vacíos
    for (let day = 1; day <= 3; day++) {
      expect(result.shifts[day - 1].sigla).toBe('');
      expect(result.shifts[day - 1].isWorkDay).toBe(false);
    }

    // Día 4 al 10: NO debe contener el texto "CUARTO TURNO" en la sigla
    const oct4 = result.shifts[3]; // índice 3 = 4 de Octubre
    const oct10 = result.shifts[9]; // índice 9 = 10 de Octubre
    const oct11 = result.shifts[10]; // índice 10 = 11 de Octubre

    expect(oct4.date).toBe('2026-10-04');
    expect(oct4.sigla).not.toBe('CUARTO TURNO');
    expect(oct4.sigla.length).toBeLessThanOrEqual(2);
    expect(oct4.isWorkDay).toBe(true);

    expect(oct10.date).toBe('2026-10-10');
    expect(oct10.sigla).not.toBe('CUARTO TURNO');
    expect(oct10.sigla.length).toBeLessThanOrEqual(2);

    // Día 11: Fuera del rango del reemplazo (2026-10-11), NO debe ser reemplazo ni tener sigla
    expect(oct11.date).toBe('2026-10-11');
    expect(oct11.isReplacement).toBe(false);
    expect(oct11.sigla).toBe('');

    // Ningún día del mes debe tener una sigla mayor a 2 letras
    for (const shift of result.shifts) {
      if (shift.sigla) {
        expect(shift.sigla.length).toBeLessThanOrEqual(2);
        expect(shift.sigla).not.toBe('CUARTO TURNO');
      }
    }
  });

  it('debe calcular dinámicamente shiftsCommittedCount en todo el rango del contrato (8 turnos en 10 días de Tercer Turno, no 4)', async () => {
    (TurnAssignment.find as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue([]),
    });

    // Reemplazo de 10 días (21 al 30 de septiembre) con Tercer Turno (L, L, N, N, X, X)
    const mockRep10Days = {
      _id: 'rep-rumina-10days',
      id_negocio: 'RPL-121',
      id_entrante: mockStaffId,
      servicio: { _id: mockServiceId, nombre: 'FARMACIA' },
      fecha_inicio: new Date('2026-09-21T00:00:00.000Z'),
      fecha_termino: new Date('2026-09-30T00:00:00.000Z'),
      tipo_turno: 'TERCER TURNO',
      snapshot_secuencia: [
        { dia: 1, sigla: 'L', es_libre: false },
        { dia: 2, sigla: 'L', es_libre: false },
        { dia: 3, sigla: 'N', es_libre: false },
        { dia: 4, sigla: 'N', es_libre: false },
        { dia: 5, sigla: 'X', es_libre: true },
        { dia: 6, sigla: 'X', es_libre: true },
      ],
      status: 'EN CURSO',
    };

    (Replacement.find as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue([mockRep10Days]),
    });

    const result = await PwaShiftsService.getShifts(mockStaffId, 9, 2026);

    expect(result.replacementContracts).toHaveLength(1);
    const contract = result.replacementContracts[0];
    expect(contract.totalDays).toBe(10);
    // En 10 días: 8 laborables (21,22,23,24,27,28,29,30) y 2 libres (25,26)
    expect(contract.shiftsCommittedCount).toBe(8);
  });

  it('debe calcular dinámicamente shiftsCommittedCount para secuencias con patrones arbitrarios no convencionales (ej: 5 días en contrato de 12 días)', async () => {
    (TurnAssignment.find as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue([]),
    });

    // Secuencia no convencional de 5 días: L, N, X, L, X (3 laborables, 2 libres por ciclo)
    // Contrato de 12 días (01 al 12 de Octubre):
    // Ciclo 1 (días 0..4): L, N, X, L, X -> 3
    // Ciclo 2 (días 5..9): L, N, X, L, X -> 3
    // Ciclo 3 parcial (días 10..11): L, N -> 2
    // Total laborables en 12 días: 3 + 3 + 2 = 8 turnos
    const mockRepCustomPattern = {
      _id: 'rep-custom-pattern',
      id_negocio: 'REP-CUSTOM',
      id_entrante: mockStaffId,
      servicio: { _id: mockServiceId, nombre: 'UCI' },
      fecha_inicio: new Date('2026-10-01T00:00:00.000Z'),
      fecha_termino: new Date('2026-10-12T00:00:00.000Z'),
      tipo_turno: 'CUSTOM_5_DAYS',
      snapshot_secuencia: [
        { dia: 1, sigla: 'L', es_libre: false },
        { dia: 2, sigla: 'N', es_libre: false },
        { dia: 3, sigla: 'X', es_libre: true },
        { dia: 4, sigla: 'L', es_libre: false },
        { dia: 5, sigla: 'X', es_libre: true },
      ],
      status: 'EN CURSO',
    };

    (Replacement.find as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue([mockRepCustomPattern]),
    });

    const result = await PwaShiftsService.getShifts(mockStaffId, 10, 2026);

    expect(result.replacementContracts).toHaveLength(1);
    const contract = result.replacementContracts[0];
    expect(contract.totalDays).toBe(12);
    expect(contract.shiftsCommittedCount).toBe(8);
  });

  it('un funcionario con contractType HONORARIO NUNCA debe proyectar turnos de planta (TurnAssignment), solo sus reemplazos adjudicados', async () => {
    // Mockeamos Staff como HONORARIO
    (Staff.findById as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ contractType: 'HONORARIO' }),
      }),
    });

    // Simulamos que por error o residuo existe un TurnAssignment en la DB para este funcionario
    (TurnAssignment.find as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue([
        {
          _id: 'asgn-erroneo',
          staffId: mockStaffId,
          start_date: new Date('2026-10-01T00:00:00.000Z'),
          end_date: new Date('2026-10-31T00:00:00.000Z'),
          turn_type: {
            nombre: 'TERCER TURNO',
            secuencia: [
              { dia: 1, sigla: 'L', es_libre: false },
              { dia: 2, sigla: 'L', es_libre: false },
            ],
          },
        },
      ]),
    });

    // Reemplazo adjudicado únicamente para los días 05 al 11 de Octubre
    const mockRepOctubre = {
      _id: 'rep-oct-5-11',
      id_negocio: 'REP-2026-5E9A',
      id_entrante: mockStaffId,
      servicio: { _id: mockServiceId, nombre: 'CIRUGIA' },
      fecha_inicio: new Date('2026-10-05T00:00:00.000Z'),
      fecha_termino: new Date('2026-10-11T00:00:00.000Z'),
      tipo_turno: 'CUARTO TURNO',
      snapshot_secuencia: [
        { dia: 1, sigla: 'L', es_libre: false },
        { dia: 2, sigla: 'N', es_libre: false },
        { dia: 3, sigla: 'X', es_libre: true },
        { dia: 4, sigla: 'X', es_libre: true },
      ],
      status: 'EN CURSO',
    };

    (Replacement.find as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue([mockRepOctubre]),
    });

    const result = await PwaShiftsService.getShifts(mockStaffId, 10, 2026);

    // Días 1 al 4: DEBEN ESTAR VACÍOS (no deben proyectar turnos de planta)
    for (let day = 1; day <= 4; day++) {
      expect(result.shifts[day - 1].sigla).toBe('');
      expect(result.shifts[day - 1].isWorkDay).toBe(false);
      expect(result.shifts[day - 1].isReplacement).toBe(false);
    }

    // Días 5 al 11: Deben pertenecer al reemplazo
    expect(result.shifts[4].date).toBe('2026-10-05');
    expect(result.shifts[4].sigla).toBe('L');
    expect(result.shifts[4].isReplacement).toBe(true);

    expect(result.shifts[10].date).toBe('2026-10-11');
    expect(result.shifts[10].sigla).toBe('X');
    expect(result.shifts[10].isReplacement).toBe(true);

    // Días 12 al 31: DEBEN ESTAR VACÍOS (no deben proyectar turnos de planta)
    for (let day = 12; day <= 31; day++) {
      expect(result.shifts[day - 1].sigla).toBe('');
      expect(result.shifts[day - 1].isWorkDay).toBe(false);
      expect(result.shifts[day - 1].isReplacement).toBe(false);
    }
  });
});

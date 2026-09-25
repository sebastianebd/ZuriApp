import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import Staff from '../../models/staff.model';
import ShiftConfirmation from '../../models/shift-confirmation.model';
import Alert from '../../models/alert.model';
import Replacement from '../../models/replacement.model';
import TurnAssignment from '../../models/turn-assignment.model';
import Service from '../../models/service.model';
import Period from '../../models/period.model';
import socketService from '../../services/socket.service';
import jwt from 'jsonwebtoken';
import { PORTAL_JWT_SECRET } from '../../services/pwa-auth.service';

// Mocks
vi.mock('../../models/period.model', () => {
  return {
    default: {
      findOne: vi.fn(),
      find: vi.fn(),
    },
  };
});

vi.mock('../../models/staff.model', () => {
  return {
    STAFF_AUDIT_FIELDS: ['rut', 'firstName', 'lastName', 'email', 'phone', 'isActive', 'roleId', 'positionId'],
    default: {
      findOne: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    },
  };
});

vi.mock('../../models/shift-confirmation.model', () => {
  return {
    default: {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      create: vi.fn(),
      find: vi.fn(),
    },
  };
});

vi.mock('../../models/alert.model', () => {
  return {
    default: {
      create: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
    },
  };
});

vi.mock('../../models/replacement.model', () => {
  return {
    REPLACEMENT_AUDIT_FIELDS: [],
    default: {
      find: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
    },
  };
});

vi.mock('../../models/turn-assignment.model', () => {
  return {
    default: {
      find: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
    },
  };
});

vi.mock('../../models/service.model', () => {
  return {
    default: {
      find: vi.fn(),
      findById: vi.fn(),
    },
  };
});

vi.mock('../../services/socket.service', () => ({
  default: {
    emitAlertNew: vi.fn(),
    emitDashboardInvalidated: vi.fn(),
    emitAlertAcknowledged: vi.fn(),
    emitAlertResolved: vi.fn(),
    emitTurnUpdate: vi.fn(),
    emitHistoryUpdate: vi.fn(),
  },
  emitAlertNew: vi.fn(),
}));

describe('PWA Shifts & Reports Controller - Integration', () => {
  const mockStaffId = '507f1f77bcf86cd799439011';
  const mockServiceId = '507f1f77bcf86cd799439022';
  const mockAssignmentId = '507f1f77bcf86cd799439033';

  const mockStaff = {
    _id: mockStaffId,
    rut: '12.345.678-9',
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '+56912345678',
    email: 'juan.perez@hospital.cl',
    contractType: 'HONORARIO',
    isActive: true,
    isDeleted: false,
    positionId: {
      _id: '507f1f77bcf86cd799439044',
      name: 'Técnico en Enfermería',
      estamento: 'TECNICO',
    },
    notificationPreferences: {
      shiftReminders: true,
      shiftChanges: true,
      openCallsEnabled: true,
      preferredServices: [],
      quietHours: { enabled: true, start: '22:00', end: '07:00' },
    },
  };

  const validCookie = `zuriapp_pwa_session=${jwt.sign(
    { staffId: mockStaffId, rut: mockStaff.rut },
    PORTAL_JWT_SECRET,
    { expiresIn: '30d' }
  )}`;

  beforeEach(() => {
    vi.clearAllMocks();
    (Staff.findById as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue(mockStaff),
    });
    (Period.findOne as any).mockResolvedValue({ month: 9, year: 2026, status: 'OPEN' });
    (ShiftConfirmation.find as any).mockResolvedValue([]);
  });

  describe('GET /api/pwa/home', () => {
    it('debería retornar 200 con el próximo turno, KPIs del mes y agenda semanal', async () => {
      // Mock de turnos y reemplazos para el home
      (TurnAssignment.find as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const mockReplacement = {
        _id: mockAssignmentId,
        id_entrante: mockStaffId,
        id_saliente: '507f1f77bcf86cd799439099',
        servicio: { _id: mockServiceId, nombre: 'Urgencias Adulto' },
        fecha_inicio: futureDate,
        fecha_termino: futureDate,
        tipo_turno: '4TO_TURNO',
        snapshot_secuencia: [
          { dia: 1, sigla: 'L', turno_entrada: '08:00', turno_salida: '20:00', es_libre: false },
        ],
      };

      (Replacement.find as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue([mockReplacement]),
      });

      (ShiftConfirmation.findOne as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/pwa/home')
        .set('Cookie', [validCookie]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('nextShift');
      expect(response.body.data).toHaveProperty('kpis');
      expect(response.body.data).toHaveProperty('weeklyAgenda');
    });

    it('debería retornar 401 si no se envía la cookie de sesión', async () => {
      const response = await request(app).get('/api/pwa/home');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/pwa/shifts', () => {
    it('debería retornar los turnos del mes y la cartola de contratos de reemplazo', async () => {
      (TurnAssignment.find as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      });
      (Replacement.find as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      });
      (ShiftConfirmation.find as any).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/pwa/shifts?month=9&year=2026')
        .set('Cookie', [validCookie]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('shifts');
      expect(response.body.data).toHaveProperty('replacementContracts');
    });
  });

  describe('POST /api/pwa/shifts/:id/confirm', () => {
    it('debería registrar confirmación ACK de asistencia', async () => {
      (Replacement.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: mockAssignmentId,
          id_entrante: mockStaffId,
          servicio: { _id: mockServiceId, nombre: 'Urgencias' },
        }),
      });

      (ShiftConfirmation.findOneAndUpdate as any).mockResolvedValue({
        _id: 'conf_1',
        staffId: mockStaffId,
        assignmentId: mockAssignmentId,
        status: 'confirmed',
      });

      const response = await request(app)
        .post(`/api/pwa/shifts/${mockAssignmentId}/confirm`)
        .set('Cookie', [validCookie])
        .send({
          assignmentModel: 'Replacement',
          date: '2026-09-25',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/confirmada/i);
    });
  });

  describe('POST /api/pwa/shifts/:id/unavailable', () => {
    it('debería fallar con 400 si el motivo tiene menos de 5 caracteres', async () => {
      const response = await request(app)
        .post(`/api/pwa/shifts/${mockAssignmentId}/unavailable`)
        .set('Cookie', [validCookie])
        .send({
          assignmentModel: 'Replacement',
          date: '2026-09-25',
          reason: 'mal',
        });

      expect(response.status).toBe(400);
    });

    it('debería registrar indisponibilidad, crear alerta OPS-03 persistente y emitir WebSocket', async () => {
      (Replacement.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: mockAssignmentId,
          id_entrante: mockStaffId,
          servicio: { _id: mockServiceId, nombre: 'Urgencias Adulto' },
        }),
      });

      (ShiftConfirmation.findOneAndUpdate as any).mockResolvedValue({
        _id: 'conf_1',
        staffId: mockStaffId,
        assignmentId: mockAssignmentId,
        status: 'unavailable',
        reason: 'Urgencia médica personal inminente',
      });

      (Alert.create as any).mockResolvedValue({
        _id: 'alert_ops03_1',
        ruleId: 'OPS-03',
        severity: 'critical',
        serviceId: mockServiceId,
        message: 'Indisponibilidad reportada',
      });

      const response = await request(app)
        .post(`/api/pwa/shifts/${mockAssignmentId}/unavailable`)
        .set('Cookie', [validCookie])
        .send({
          assignmentModel: 'Replacement',
          date: '2026-09-25',
          reason: 'Urgencia médica personal inminente',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificamos creación de alerta OPS-03 persistente en MongoDB
      expect(Alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ruleId: 'OPS-03',
          severity: 'critical',
          serviceId: mockServiceId,
          staffId: mockStaffId,
        })
      );

      // Verificamos emisión WebSocket
      expect(socketService.emitAlertNew).toHaveBeenCalled();
    });
  });

  describe('Reportes PDF (Anti-IDOR)', () => {
    it('GET /api/pwa/reports/advance debería emitir PDF con Content-Type application/pdf', async () => {
      const response = await request(app)
        .get('/api/pwa/reports/advance?month=9&year=2026')
        .set('Cookie', [validCookie]);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/pdf/);
    }, 15000);

    it('GET /api/pwa/reports/cartola debería emitir PDF de cartola oficial', async () => {
      const response = await request(app)
        .get('/api/pwa/reports/cartola?month=8&year=2026')
        .set('Cookie', [validCookie]);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/pdf/);
    }, 15000);

    it('GET /api/pwa/replacements/:id/voucher debería permitir descargar comprobante si participó en el reemplazo', async () => {
      (Replacement.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: mockAssignmentId,
          id_entrante: { _id: mockStaffId, rut: mockStaff.rut, firstName: 'Juan', lastName: 'Pérez' },
          id_saliente: { _id: 'other_staff', rut: '11.111.111-1', firstName: 'Pedro', lastName: 'Gómez' },
          servicio: { _id: mockServiceId, nombre: 'Urgencias' },
          fecha_inicio: new Date('2026-09-01'),
          fecha_termino: new Date('2026-09-15'),
          motivo: 'LICENCIA_MEDICA',
        }),
      });

      const response = await request(app)
        .get(`/api/pwa/replacements/${mockAssignmentId}/voucher`)
        .set('Cookie', [validCookie]);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/pdf/);
    });

    it('Anti-IDOR: GET /api/pwa/replacements/:id/voucher debería rechazar con 403 si el reemplazo no le pertenece', async () => {
      (Replacement.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: mockAssignmentId,
          id_entrante: { _id: 'other_staff_1' },
          id_saliente: { _id: 'other_staff_2' },
          servicio: { _id: mockServiceId, nombre: 'Urgencias' },
        }),
      });

      const response = await request(app)
        .get(`/api/pwa/replacements/${mockAssignmentId}/voucher`)
        .set('Cookie', [validCookie]);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/no tienes autorización/i);
    });
  });

  describe('PATCH /api/pwa/profile/preferences', () => {
    it('debería actualizar preferencias de notificación del funcionario', async () => {
      (Staff.findByIdAndUpdate as any).mockResolvedValue(mockStaff);

      const response = await request(app)
        .patch('/api/pwa/profile/preferences')
        .set('Cookie', [validCookie])
        .send({
          shiftReminders: true,
          shiftChanges: false,
          openCallsEnabled: true,
          preferredServices: [mockServiceId],
          quietHours: { enabled: true, start: '23:00', end: '06:00' },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Staff.findByIdAndUpdate).toHaveBeenCalledWith(
        mockStaffId,
        expect.objectContaining({
          $set: expect.objectContaining({
            'notificationPreferences.shiftChanges': false,
          }),
        }),
        { new: true }
      );
    });
  });
});

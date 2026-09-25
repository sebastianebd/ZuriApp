import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import ReplacementOffer from '../../models/replacement-offer.model';
import Replacement from '../../models/replacement.model';
import Staff from '../../models/staff.model';
import Alert from '../../models/alert.model';
import socketService from '../../services/socket.service';
import { replacementOfferQueue } from '../../queues/replacement-offer.queue';
import jwt from 'jsonwebtoken';
import { PORTAL_JWT_SECRET } from '../../services/pwa-auth.service';
import ReplacementOfferService from '../../services/replacement-offer.service';
import AvailabilityService from '../../services/availability.service';

vi.mock('../../services/availability.service', () => ({
  default: {
    scoreOfferApplicants: vi.fn(),
    getTopEligibleCandidates: vi.fn(),
    validateCompliance: vi.fn(),
  },
  AvailabilityService: {
    scoreOfferApplicants: vi.fn(),
    getTopEligibleCandidates: vi.fn(),
    validateCompliance: vi.fn(),
  },
}));

// Mock authentication middleware (Jefatura Desktop)
vi.mock('../../middleware/authentication.middleware', () => ({
  default: (req: any, res: any, next: any) => {
    req.staff = { _id: '507f1f77bcf86cd799439001', firstName: 'Jefa', lastName: 'Servicio', roleId: { level: 50 } };
    req.account = { id: '507f1f77bcf86cd799439001', name: 'Jefa Servicio' };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => next(),
}));

// Mock Models
vi.mock('../../models/replacement-offer.model', () => {
  return {
    default: {
      find: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findOneAndUpdate: vi.fn(),
    },
  };
});

vi.mock('../../models/replacement.model', () => {
  return {
    REPLACEMENT_AUDIT_FIELDS: [],
    AusenciaSalienteMotivo: {
      LICENCIA_MEDICA: 'LICENCIA_MEDICA',
      PRE_POST_NATAL: 'PRE_POST_NATAL',
    },
    default: {
      find: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    },
  };
});

vi.mock('../../models/staff.model', () => {
  return {
    STAFF_AUDIT_FIELDS: ['rut', 'firstName', 'lastName', 'email', 'phone', 'isActive', 'roleId', 'positionId'],
    default: {
      find: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
    },
  };
});

vi.mock('../../models/service.model', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439022', nombre: 'Urgencias' }),
    }),
    findOne: vi.fn(),
  },
}));

vi.mock('../../models/alert.model', () => {
  return {
    default: {
      create: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
    },
  };
});

vi.mock('../../models/turn-type.model', () => ({
  default: {
    find: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    }),
    findOne: vi.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439033',
      nombre: '4TO_TURNO',
      toObject: () => ({
        secuencia: [
          { dia: 1, sigla: 'L', turno_entrada: '08:00', turno_salida: '20:00', es_libre: false },
          { dia: 2, sigla: 'N', turno_entrada: '20:00', turno_salida: '08:00', es_libre: false },
          { dia: 3, sigla: 'X', turno_entrada: null, turno_salida: null, es_libre: true },
          { dia: 4, sigla: 'X', turno_entrada: null, turno_salida: null, es_libre: true },
        ],
      }),
    }),
  },
  TURN_TYPE_AUDIT_FIELDS: [],
}));

vi.mock('@bull-board/api', () => ({
  createBullBoard: vi.fn(),
}));

vi.mock('@bull-board/api/bullMQAdapter', () => {
  return {
    BullMQAdapter: class {
      setFormatter() {}
    },
  };
});

vi.mock('../../queues/replacement-offer.queue', () => ({
  REPLACEMENT_OFFER_QUEUE: 'replacement-offer-queue',
  replacementOfferQueue: {
    add: vi.fn().mockResolvedValue({ id: 'mock_job_id' }),
    name: 'replacementOfferQueue',
    getName: vi.fn().mockReturnValue('replacementOfferQueue'),
  },
  setupReplacementOfferWorker: vi.fn(),
}));

vi.mock('../../services/socket.service', () => ({
  default: {
    emitTurnUpdate: vi.fn(),
    emitHistoryUpdate: vi.fn(),
    emitAlertNew: vi.fn(),
    emitOfferCreated: vi.fn(),
    emitOfferApplied: vi.fn(),
    emitOfferWithdrawnConflict: vi.fn(),
    emitOfferCancelled: vi.fn(),
    emitOfferAwarded: vi.fn(),
  },
  emitAlertNew: vi.fn(),
}));

describe('Replacement Offer Controller - Integration & Cascade Flow (TDD RED)', () => {
  const mockJefaId = '507f1f77bcf86cd799439001';
  const mockServiceId = '507f1f77bcf86cd799439022';
  const mockPositionId = '507f1f77bcf86cd799439044';
  const mockSalienteId = '507f1f77bcf86cd799439055';
  const mockHonorarioId = '507f1f77bcf86cd799439077';
  const mockOfferId = '507f1f77bcf86cd799439088';

  const mockHonorarioStaff = {
    _id: mockHonorarioId,
    rut: '17.890.123-4',
    firstName: 'Honorario',
    lastName: 'Tens',
    contractType: 'HONORARIO',
    isActive: true,
    isDeleted: false,
    positionId: {
      _id: mockPositionId,
      name: 'Técnico en Enfermería',
      estamento: 'TECNICO',
    },
  };

  const validPwaCookie = `zuriapp_pwa_session=${jwt.sign(
    { staffId: mockHonorarioId, rut: mockHonorarioStaff.rut },
    PORTAL_JWT_SECRET,
    { expiresIn: '30d' }
  )}`;

  const createStaffQueryMock = (staffObj: any) => {
    const p: any = Promise.resolve(staffObj);
    p.populate = vi.fn().mockResolvedValue(staffObj);
    return p;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (Staff.findById as any).mockImplementation(() => createStaffQueryMock(mockHonorarioStaff));
  });

  describe('POST /api/replacement-offers (Creación y Encolado Delayed Job)', () => {
    it('crea la convocatoria y encola el delayed job en BullMQ con delay exacto hasta expiresAt', async () => {
      const futureExpiration = new Date(Date.now() + 7200000); // 2 horas
      const payload = {
        serviceId: mockServiceId,
        positionId: mockPositionId,
        id_saliente: mockSalienteId,
        motivo: 'LICENCIA_MEDICA',
        observaciones: 'Licencia por 3 días',
        tipo_turno: '4TO_TURNO',
        fecha_inicio: new Date('2026-10-05T08:00:00.000Z').toISOString(),
        fecha_termino: new Date('2026-10-07T20:00:00.000Z').toISOString(),
        expiresAt: futureExpiration.toISOString(),
      };

      const mockCreatedOffer = {
        _id: mockOfferId,
        ...payload,
        status: 'open',
        applicants: [],
        creado_por: mockJefaId,
      };

      (ReplacementOffer.create as any).mockResolvedValue(mockCreatedOffer);

      const response = await request(app)
        .post('/api/replacement-offers')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', mockOfferId);

      // Verificamos que se encola en BullMQ con delay
      expect(replacementOfferQueue.add).toHaveBeenCalledWith(
        'expireOffer',
        { offerId: mockOfferId },
        expect.objectContaining({
          delay: expect.any(Number),
        })
      );
    });
  });

  describe('POST /api/replacement-offers/:id/award (Adjudicación Atómica y Retiro en Cascada)', () => {
    it('adjudica la oferta atómicamente, crea Replacement y retira en cascada de ofertas en conflicto', async () => {
      const mockAwardingOffer = {
        _id: mockOfferId,
        serviceId: mockServiceId,
        positionId: mockPositionId,
        id_saliente: mockSalienteId,
        rut_saliente: '11.222.333-4',
        nombre_saliente: 'Maria',
        apellido_saliente: 'Saliente',
        motivo: 'LICENCIA_MEDICA',
        observaciones: 'Reposo',
        fecha_inicio: new Date('2026-10-05T08:00:00.000Z'),
        fecha_termino: new Date('2026-10-05T20:00:00.000Z'),
        tipo_turno: 'LARGO',
        status: 'open',
        applicants: [
          { staffId: mockHonorarioId, status: 'pending' },
          { staffId: 'other_staff_2', status: 'pending' },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      // Otra oferta donde mockHonorarioId está postulado que colisiona (mismo día noche)
      const mockConflictingOffer = {
        _id: '507f1f77bcf86cd799439099',
        serviceId: 'srv_otro',
        fecha_inicio: new Date('2026-10-05T20:00:00.000Z'),
        fecha_termino: new Date('2026-10-06T08:00:00.000Z'),
        status: 'open',
        applicants: [
          { staffId: mockHonorarioId, status: 'pending' },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      (ReplacementOffer.findById as any).mockResolvedValue(mockAwardingOffer);
      (ReplacementOffer.find as any).mockResolvedValue([mockConflictingOffer]);
      (Staff.findById as any).mockResolvedValue(mockHonorarioStaff);
      (Replacement.create as any).mockResolvedValue({
        _id: 'rep_new_1',
        id_negocio: 'REP-2026-001',
        id_entrante: mockHonorarioId,
      });

      const response = await request(app)
        .post(`/api/replacement-offers/${mockOfferId}/award`)
        .send({ targetStaffId: mockHonorarioId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificamos que Replacement.create recibe todos los campos obligatorios del esquema y un status válido
      expect(Replacement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id_saliente: mockSalienteId,
          rut_saliente: '11.222.333-4',
          nombre_saliente: 'Maria',
          apellido_saliente: 'Saliente',
          id_entrante: expect.anything(),
          rut_entrante: mockHonorarioStaff.rut,
          nombre_entrante: mockHonorarioStaff.firstName,
          apellido_entrante: mockHonorarioStaff.lastName,
          status: expect.stringMatching(/^(PENDIENTE|EN CURSO)$/),
        })
      );

      // Verificamos que la oferta ganadora queda filled
      expect(mockAwardingOffer.status).toBe('filled');
      expect(mockAwardingOffer.applicants.find((a: any) => a.staffId === mockHonorarioId)?.status).toBe('selected');

      // Verificamos retiro en cascada en la otra oferta
      expect(mockConflictingOffer.applicants.find((a: any) => a.staffId === mockHonorarioId)?.status).toBe('withdrawn_conflict');
      expect(mockConflictingOffer.save).toHaveBeenCalled();
    });
  });

  describe('GET /api/replacement-offers/open (PWA Honorarios - Confidencialidad)', () => {
    it('retorna ofertas abiertas del cargo del honorario sin exponer causal ni RUT del saliente', async () => {
      const mockOffers = [
        {
          _id: mockOfferId,
          serviceId: { _id: mockServiceId, nombre: 'Urgencias' },
          positionId: mockPositionId,
          tipo_turno: '4TO_TURNO',
          fecha_inicio: new Date('2026-10-05'),
          fecha_termino: new Date('2026-10-07'),
          expiresAt: new Date('2026-10-04'),
          status: 'open',
          motivo: 'LICENCIA_MEDICA_GRAVE_CONFIDENCIAL',
          rut_saliente: '11.222.333-4',
          nombre_saliente: 'Pedro',
          applicants: [],
        },
      ];

      (ReplacementOffer.find as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockOffers),
      });

      const response = await request(app)
        .get('/api/replacement-offers/open')
        .set('Cookie', [validPwaCookie]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);

      // Confidencialidad hospitalaria estricta
      const offerItem = response.body.data[0];
      expect(offerItem).not.toHaveProperty('motivo');
      expect(offerItem).not.toHaveProperty('rut_saliente');
      expect(offerItem).not.toHaveProperty('nombre_saliente');
    });
  });

  describe('POST /api/replacement-offers/:id/apply (Postulación PWA con Pre-validación)', () => {
    it('permite postular a una oferta abierta, crea alerta OPS-05 en campana y emite eventos en tiempo real', async () => {
      const mockOffer = {
        _id: mockOfferId,
        serviceId: mockServiceId,
        positionId: mockPositionId,
        fecha_inicio: new Date('2026-10-05T08:00:00.000Z'),
        fecha_termino: new Date('2026-10-05T20:00:00.000Z'),
        tipo_turno: '4TO_TURNO',
        status: 'open',
        applicants: [] as any[],
        save: vi.fn().mockResolvedValue(true),
      };

      (ReplacementOffer.findById as any).mockResolvedValue(mockOffer);
      (Replacement.find as any).mockResolvedValue([]); // No tiene reemplazos previos
      (Alert.create as any).mockResolvedValue({
        _id: 'alert-ops-05',
        ruleId: 'OPS-05',
        created_at: new Date(),
        message: 'Nuevo postulante a la bolsa de reemplazos',
      });

      const response = await request(app)
        .post(`/api/replacement-offers/${mockOfferId}/apply`)
        .set('Cookie', [validPwaCookie]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockOffer.applicants.length).toBe(1);
      expect(mockOffer.applicants[0].staffId.toString()).toBe(mockHonorarioId);
      expect(mockOffer.applicants[0].status).toBe('pending');

      // 1. Alerta OPS-05 en MongoDB para la campana de jefatura
      expect(Alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ruleId: 'OPS-05',
          severity: 'medium',
          category: 'operational',
          status: 'active',
        })
      );

      // 2. Emisión Socket para campana en tiempo real con status active
      expect(socketService.emitAlertNew).toHaveBeenCalledWith(
        mockServiceId.toString(),
        expect.objectContaining({
          ruleId: 'OPS-05',
          severity: 'medium',
          status: 'active',
        })
      );

      // 3. Emisión Socket para actualizar contador de postulantes en vivo (de 0 a 1)
      expect(socketService.emitOfferApplied).toHaveBeenCalledWith(
        mockServiceId.toString(),
        expect.objectContaining({
          offerId: mockOfferId,
          applicantsCount: 1,
        })
      );
    });

    it('rechaza con 400 si el funcionario no es de estamento/cargo compatible', async () => {
      const mockOtherPositionStaff = {
        ...mockHonorarioStaff,
        positionId: { _id: 'other_pos', name: 'Médico' },
      };

      (Staff.findById as any).mockImplementation(() =>
        createStaffQueryMock(mockOtherPositionStaff)
      );

      const mockOffer = {
        _id: mockOfferId,
        positionId: mockPositionId, // TENS
        status: 'open',
        applicants: [],
      };

      (ReplacementOffer.findById as any).mockResolvedValue(mockOffer);

      const response = await request(app)
        .post(`/api/replacement-offers/${mockOfferId}/apply`)
        .set('Cookie', [validPwaCookie]);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/cargo/i);
    });
  });

  describe('POST /api/replacement-offers/:id/withdraw (Cancelación Voluntaria)', () => {
    it('cancela voluntariamente la postulación activa del honorario, descuenta a 0 y emite socket', async () => {
      const mockOffer = {
        _id: mockOfferId,
        serviceId: mockServiceId,
        status: 'open',
        applicants: [
          { staffId: mockHonorarioId, status: 'pending' },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      (ReplacementOffer.findById as any).mockResolvedValue(mockOffer);

      const response = await request(app)
        .post(`/api/replacement-offers/${mockOfferId}/withdraw`)
        .set('Cookie', [validPwaCookie]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockOffer.applicants[0].status).toBe('cancelled_by_staff');
      expect(mockOffer.save).toHaveBeenCalled();

      // Emisión de socket con contador actualizado descontando el retiro (0)
      expect(socketService.emitOfferApplied).toHaveBeenCalledWith(
        mockServiceId.toString(),
        expect.objectContaining({
          offerId: mockOfferId,
          applicantsCount: 0,
        })
      );
    });
  });

  describe('GET /api/replacement-offers (Listado Jefatura con Filtro Activo)', () => {
    it('descuenta correctamente los postulantes que hayan cancelado o retirado su postulación', async () => {
      const mockOffers = [
        {
          _id: mockOfferId,
          serviceId: { _id: mockServiceId, nombre: 'Urgencias' },
          positionId: { _id: mockPositionId, name: 'Tens' },
          status: 'open',
          applicants: [
            { staffId: mockHonorarioId, status: 'cancelled_by_staff' },
          ],
        },
      ];

      (ReplacementOffer.find as any).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(mockOffers),
        }),
      });

      const response = await request(app).get('/api/replacement-offers');

      expect(response.status).toBe(200);
      expect(response.body.data[0].applicantsCount).toBe(0);
    });
  });

  describe('Worker de Expiración (BullMQ Job Execution & OPS-04)', () => {
    it('pasa a finalized y genera OPS-04 si expira sin postulantes', async () => {
      const mockOffer = {
        _id: mockOfferId,
        serviceId: mockServiceId,
        tipo_turno: '4TO_TURNO',
        fecha_inicio: new Date('2026-10-05T08:00:00.000Z'),
        status: 'open',
        applicants: [],
        save: vi.fn().mockResolvedValue(true),
      };

      (ReplacementOffer.findById as any).mockResolvedValue(mockOffer);
      (Alert.create as any).mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
        ruleId: 'OPS-04',
        message: 'Convocatoria desierta',
        context: { offerId: mockOfferId },
      });

      await ReplacementOfferService.processOfferExpiration(mockOfferId);

      expect(mockOffer.status).toBe('finalized');
      expect(mockOffer.save).toHaveBeenCalled();
      expect(Alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ruleId: 'OPS-04',
          severity: 'high',
          serviceId: mockServiceId,
        })
      );
      expect(socketService.emitAlertNew).toHaveBeenCalled();
    });

    it('pasa a finalized pero NO genera alerta si cuenta con postulantes activos', async () => {
      const mockOffer = {
        _id: mockOfferId,
        serviceId: mockServiceId,
        tipo_turno: '4TO_TURNO',
        fecha_inicio: new Date('2026-10-05T08:00:00.000Z'),
        status: 'open',
        applicants: [{ staffId: mockHonorarioId, status: 'pending' }],
        save: vi.fn().mockResolvedValue(true),
      };

      (ReplacementOffer.findById as any).mockResolvedValue(mockOffer);

      await ReplacementOfferService.processOfferExpiration(mockOfferId);

      expect(mockOffer.status).toBe('finalized');
      expect(mockOffer.save).toHaveBeenCalled();
      expect(Alert.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/replacement-offers/:id/scoring', () => {
    it('retorna candidatos rankeados con isCallList: false cuando hay postulantes activos', async () => {
      const mockOffer = {
        _id: mockOfferId,
        applicants: [{ staffId: mockHonorarioId, status: 'pending' }],
      };

      (ReplacementOffer.findById as any).mockResolvedValue(mockOffer);

      const mockScoredList = [
        {
          staffId: mockHonorarioId,
          fullName: 'Carlos Pérez',
          rut: '11.111.111-1',
          phone: '+56911111111',
          positionName: 'Técnico en Enfermería',
          score: 85,
          breakdown: {
            previousReplacements: 3,
            accumulatedHoursMonthly: 40,
            hoursSinceLastShift: 36,
            matchesPosition: true,
            cleanRecord: true,
            nearWeeklyCapPenalty: false,
            nightShiftAdjacencyPenalty: false,
          },
        },
      ];

      (AvailabilityService.scoreOfferApplicants as any).mockResolvedValue(mockScoredList);

      const response = await request(app).get(`/api/replacement-offers/${mockOfferId}/scoring`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isCallList).toBe(false);
      expect(response.body.data.candidates).toHaveLength(1);
      expect(response.body.data.candidates[0].score).toBe(85);
      expect(response.body.data.candidates[0].breakdown.previousReplacements).toBe(3);
    });

    it('retorna Top 10 candidatos con teléfonos directos e isCallList: true si no hay postulantes', async () => {
      const mockOffer = {
        _id: mockOfferId,
        serviceId: mockServiceId,
        positionId: mockPositionId,
        fecha_inicio: new Date('2026-10-15T08:00:00.000Z'),
        fecha_termino: new Date('2026-10-15T20:00:00.000Z'),
        applicants: [],
      };

      (ReplacementOffer.findById as any).mockResolvedValue(mockOffer);

      const mockTopList = [
        {
          staffId: 'staff_contingency',
          fullName: 'Laura Directa',
          rut: '15.555.555-5',
          phone: '+56999887766',
          positionName: 'Técnico en Enfermería',
          score: 70,
          breakdown: {
            previousReplacements: 1,
            accumulatedHoursMonthly: 20,
            hoursSinceLastShift: 48,
            matchesPosition: true,
            cleanRecord: true,
            nearWeeklyCapPenalty: false,
            nightShiftAdjacencyPenalty: false,
          },
        },
      ];

      (AvailabilityService.getTopEligibleCandidates as any).mockResolvedValue(mockTopList);

      const response = await request(app).get(`/api/replacement-offers/${mockOfferId}/scoring`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isCallList).toBe(true);
      expect(response.body.data.candidates).toHaveLength(1);
      expect(response.body.data.candidates[0].phone).toBe('+56999887766');
    });
  });

  describe('PATCH /api/replacement-offers/:id/cancel (Anulación de Convocatoria)', () => {
    it('anula la convocatoria y emite evento offer:cancelled', async () => {
      const mockOffer = {
        _id: mockOfferId,
        serviceId: mockServiceId,
        status: 'open',
        observaciones: 'Original',
        save: vi.fn().mockResolvedValue(true),
      };

      (ReplacementOffer.findById as any).mockResolvedValue(mockOffer);

      const response = await request(app)
        .patch(`/api/replacement-offers/${mockOfferId}/cancel`)
        .send({ reason: 'Reorganización de personal' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockOffer.status).toBe('cancelled');
      expect(mockOffer.observaciones).toContain('Reorganización de personal');
      expect(mockOffer.save).toHaveBeenCalled();
      expect(socketService.emitOfferCancelled).toHaveBeenCalledWith(
        mockServiceId.toString(),
        expect.objectContaining({
          offerId: mockOfferId.toString(),
          status: 'cancelled',
        })
      );
    });
  });
});

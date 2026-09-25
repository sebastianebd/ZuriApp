import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import Staff from '../../models/staff.model';
import * as redisConfig from '../../config/redis.config';
import notificationService from '../../services/notification.service';
import jwt from 'jsonwebtoken';
import { PORTAL_JWT_SECRET } from '../../services/pwa-auth.service';

// Mocks
vi.mock('../../models/staff.model', () => {
  return {
    STAFF_AUDIT_FIELDS: ['rut', 'firstName', 'lastName', 'email', 'phone', 'isActive', 'roleId', 'positionId'],
    default: {
      findOne: vi.fn(),
      findById: vi.fn(),
    },
  };
});

vi.mock('../../services/notification.service', () => ({
  default: {
    sendOTP: vi.fn(),
    sendWhatsApp: vi.fn(),
  },
  sendOTP: vi.fn(),
}));

describe('PWA Auth Controller - Integration', () => {
  const mockStaff = {
    _id: '507f1f77bcf86cd799439011',
    rut: '12.345.678-9',
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '+56912345678',
    email: 'juan.perez@hospital.cl',
    contractType: 'HONORARIO',
    isActive: true,
    isDeleted: false,
    positionId: {
      _id: '507f1f77bcf86cd799439022',
      name: 'Técnico en Enfermería (TENS)',
      estamento: 'TECNICO',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/pwa/auth/request-otp', () => {
    it('debería retornar 200, almacenar OTP en Redis y despachar WhatsApp para un funcionario activo', async () => {
      (Staff.findOne as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStaff),
      });
      // Rate limit check: less than 3 attempts
      (redisConfig.get as any).mockImplementation((key: string) => {
        if (key.includes('ratelimit')) return Promise.resolve(null);
        return Promise.resolve(null);
      });
      (redisConfig.set as any).mockResolvedValue(undefined);
      (notificationService.sendOTP as any).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/pwa/auth/request-otp')
        .send({ rut: '12.345.678-9' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/código de verificación enviado/i);
      // Bug repro: maskedPhone debe estar presente y enmascarado para mostrarse en la PWA
      expect(response.body.maskedPhone).toBeDefined();
      expect(response.body.maskedPhone).toContain('5678');
      expect(response.body.maskedPhone).toMatch(/[•\*]/);
      expect(response.body.expiresInSeconds).toBe(600);
      expect(response.body.resendCooldownSeconds).toBe(60);

      // Verificamos que se guarde el OTP en Redis con TTL de 10 min (600s)
      expect(redisConfig.set).toHaveBeenCalledWith(
        expect.stringContaining('pwa:otp:12345678-9'),
        expect.stringMatching(/^\d{6}$/),
        600
      );

      // Verificamos despacho por WhatsApp
      expect(notificationService.sendOTP).toHaveBeenCalledWith(
        mockStaff.phone,
        expect.stringMatching(/^\d{6}$/)
      );
    });

    it('debería retornar 400 si el formato de RUT es inválido', async () => {
      const response = await request(app)
        .post('/api/pwa/auth/request-otp')
        .send({ rut: 'invalid-rut' });

      expect(response.status).toBe(400);
    });

    it('debería retornar 404 si el funcionario no existe o está inactivo', async () => {
      (Staff.findOne as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      const response = await request(app)
        .post('/api/pwa/auth/request-otp')
        .send({ rut: '99.999.999-9' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/funcionario no encontrado o inactivo/i);
    });

    it('debería retornar 429 Too Many Requests si supera 3 solicitudes en 10 minutos', async () => {
      (Staff.findOne as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStaff),
      });
      // Simulamos que el rate limit ya llegó a 3 intentos
      (redisConfig.get as any).mockImplementation((key: string) => {
        if (key.includes('ratelimit')) return Promise.resolve(3);
        return Promise.resolve(null);
      });

      const response = await request(app)
        .post('/api/pwa/auth/request-otp')
        .send({ rut: '12.345.678-9' });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/has superado el límite de intentos/i);
      expect(notificationService.sendOTP).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/pwa/auth/verify-otp', () => {
    it('debería verificar OTP correcto, setear cookie de 30 días y retornar perfil', async () => {
      (Staff.findOne as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStaff),
      });
      (redisConfig.get as any).mockImplementation((key: string) => {
        if (key.includes('pwa:otp:')) return Promise.resolve('749201');
        return Promise.resolve(null);
      });
      (redisConfig.del as any).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/pwa/auth/verify-otp')
        .send({ rut: '12.345.678-9', otp: '749201' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.staff.rut).toBe(mockStaff.rut);
      expect(response.body.data.staff.contractType).toBe('HONORARIO');
      expect(response.body.data.staff.estamento).toBe('TECNICO');

      // Verificamos que se limpie el OTP de Redis
      expect(redisConfig.del).toHaveBeenCalledWith(expect.stringContaining('pwa:otp:12345678-9'));

      // Verificamos cookie de sesión HttpOnly y SameSite
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('zuriapp_pwa_session=');
      expect(cookies[0]).toMatch(/HttpOnly/i);
      expect(cookies[0]).toMatch(/SameSite=Lax/i);
    });

    it('debería retornar 400 si el OTP es incorrecto o ya expiró', async () => {
      (redisConfig.get as any).mockResolvedValue(null); // No existe en Redis

      const response = await request(app)
        .post('/api/pwa/auth/verify-otp')
        .send({ rut: '12.345.678-9', otp: '000000' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/código de verificación inválido o expirado/i);
      expect(response.headers['set-cookie']).toBeUndefined();
    });
  });

  describe('GET /api/pwa/auth/me', () => {
    it('debería retornar 401 si no se envía la cookie de sesión', async () => {
      const response = await request(app).get('/api/pwa/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('debería retornar 200 con el perfil del usuario autenticado si la cookie es válida', async () => {
      const token = jwt.sign(
        { staffId: mockStaff._id, rut: mockStaff.rut },
        PORTAL_JWT_SECRET,
        { expiresIn: '30d' }
      );

      (Staff.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStaff),
      });

      const response = await request(app)
        .get('/api/pwa/auth/me')
        .set('Cookie', [`zuriapp_pwa_session=${token}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.staff.id).toBe(mockStaff._id);
      expect(response.body.data.staff.fullName).toBe('Juan Pérez');
    });

    it('Anti-IDOR: debería ignorar cualquier staffId en query param o body y retornar al usuario en sesión', async () => {
      const token = jwt.sign(
        { staffId: mockStaff._id, rut: mockStaff.rut },
        PORTAL_JWT_SECRET,
        { expiresIn: '30d' }
      );

      (Staff.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStaff),
      });

      const response = await request(app)
        .get('/api/pwa/auth/me?staffId=attacker_injected_id')
        .set('Cookie', [`zuriapp_pwa_session=${token}`]);

      expect(response.status).toBe(200);
      expect(response.body.data.staff.id).toBe(mockStaff._id);
      expect(Staff.findById).toHaveBeenCalledWith(mockStaff._id);
    });
  });

  describe('POST /api/pwa/auth/logout', () => {
    it('debería limpiar la cookie zuriapp_pwa_session y responder 200', async () => {
      const token = jwt.sign(
        { staffId: mockStaff._id, rut: mockStaff.rut },
        PORTAL_JWT_SECRET,
        { expiresIn: '30d' }
      );

      (Staff.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStaff),
      });

      const response = await request(app)
        .post('/api/pwa/auth/logout')
        .set('Cookie', [`zuriapp_pwa_session=${token}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/zuriapp_pwa_session=;/);
    });
  });
});

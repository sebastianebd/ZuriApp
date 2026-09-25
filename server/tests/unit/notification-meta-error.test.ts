import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import notificationService, { sendWhatsApp, sendOTP } from '../../services/notification.service';
import logger from '../../config/logger.config';
import { PwaAuthService } from '../../services/pwa-auth.service';
import Staff from '../../models/staff.model';
import * as redisConfig from '../../config/redis.config';

vi.mock('../../config/logger.config', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('axios');

vi.mock('../../models/staff.model', () => ({
  STAFF_AUDIT_FIELDS: ['rut', 'firstName', 'lastName', 'email', 'phone', 'isActive', 'roleId', 'positionId'],
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('../../config/redis.config', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

describe('Notification Service & PWA OTP - Manejo de Errores Meta API (TDD RED)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WHATSAPP_TOKEN = '  EAAG_MOCK_TOKEN_WITH_SPACES  \r\n';
    process.env.WHATSAPP_PHONE_ID = '  944309542097074  \n';
    process.env.WHATSAPP_VERSION = 'v20.0';
  });

  it('sanitiza WHATSAPP_TOKEN y WHATSAPP_PHONE_ID removiendo espacios y saltos de línea al invocar Meta API', async () => {
    const axiosPostMock = vi.mocked(axios.post);
    axiosPostMock.mockResolvedValueOnce({
      data: { messages: [{ id: 'wamid.123' }] },
    });

    const result = await sendWhatsApp('+56950572047', 'Mensaje de prueba');

    expect(result).toBe(true);
    expect(axiosPostMock).toHaveBeenCalled();
    const [url, , config] = axiosPostMock.mock.calls[0];

    // Verifica que la URL use el Phone ID limpio y la versión de env
    expect(url).toBe('https://graph.facebook.com/v20.0/944309542097074/messages');
    // Verifica que el Bearer token esté limpio sin espacios ni saltos de línea
    expect(config?.headers?.Authorization).toBe('Bearer EAAG_MOCK_TOKEN_WITH_SPACES');
  });

  it('maneja error 190 (OAuthException / Authentication Error) de Meta y retorna false sin lanzar excepción no capturada', async () => {
    const axiosPostMock = vi.mocked(axios.post);
    const metaError190 = {
      response: {
        status: 401,
        data: {
          error: {
            message: 'Authentication Error',
            code: 190,
            type: 'OAuthException',
            fbtrace_id: 'Ak3ZiFfL0pJrcL2oKcv0tG3',
          },
        },
      },
    };
    axiosPostMock.mockRejectedValueOnce(metaError190);

    const result = await sendWhatsApp('+56950572047', 'Mensaje con token inválido');

    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('[WhatsApp] Error enviando a +56950572047: Authentication Error')
    );
  });

  it('PwaAuthService.requestOtp informa deliveryStatus: "failed" cuando el despacho de WhatsApp falla por error de Meta', async () => {
    const mockStaff = {
      _id: '507f1f77bcf86cd799439011',
      rut: '12.345.678-9',
      phone: '+56950572047',
      isActive: true,
      isDeleted: false,
      positionId: { name: 'TENS' },
    };

    (Staff.findOne as any).mockReturnValue({
      populate: vi.fn().mockResolvedValue(mockStaff),
    });
    (redisConfig.get as any).mockResolvedValue(null);
    (redisConfig.set as any).mockResolvedValue(undefined);

    // Mock axios para simular fallo 190 de Meta en sendOTP
    const axiosPostMock = vi.mocked(axios.post);
    axiosPostMock.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          error: { message: 'Authentication Error', code: 190, type: 'OAuthException' },
        },
      },
    });

    const response = await PwaAuthService.requestOtp('12.345.678-9');

    expect(response.success).toBe(true);
    // Debe advertir que la entrega por WhatsApp falló
    expect(response.deliveryStatus).toBe('failed');
    expect(response.message).toMatch(/no fue posible entregar el mensaje por WhatsApp/i);
    expect(response.maskedPhone).toContain('2047');
  });
});

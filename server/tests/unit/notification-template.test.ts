import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { sendOTP, sendWhatsAppTemplate } from '../../services/notification.service';

vi.mock('../../config/logger.config', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('axios');

describe('Notification Service - Soporte de Plantillas Meta (Templates) para OTP (TDD RED)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WHATSAPP_TOKEN = 'VALID_META_TOKEN';
    process.env.WHATSAPP_PHONE_ID = '1260506263821088';
    process.env.WHATSAPP_VERSION = 'v18.0';
    delete process.env.WHATSAPP_OTP_TEMPLATE_NAME;
    delete process.env.WHATSAPP_TEMPLATE_LANG;
  });

  it('sendWhatsAppTemplate envía un payload de type: "template" estructurado para Meta API', async () => {
    const axiosPostMock = vi.mocked(axios.post);
    axiosPostMock.mockResolvedValueOnce({
      data: { messages: [{ id: 'wamid.template_123' }] },
    });

    const result = await sendWhatsAppTemplate(
      '+56950572047',
      'zuriapp_otp',
      'es',
      [{ type: 'text', text: '654321' }]
    );

    expect(result).toBe(true);
    expect(axiosPostMock).toHaveBeenCalled();
    const [url, payload] = axiosPostMock.mock.calls[0];

    expect(url).toContain('/1260506263821088/messages');
    expect(payload).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '56950572047',
      type: 'template',
      template: {
        name: 'zuriapp_otp',
        language: { code: 'es' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: '654321' }],
          },
        ],
      },
    });
  });

  it('sendOTP utiliza la plantilla configurada en WHATSAPP_OTP_TEMPLATE_NAME cuando está definida', async () => {
    process.env.WHATSAPP_OTP_TEMPLATE_NAME = 'zuriapp_auth_code';
    process.env.WHATSAPP_TEMPLATE_LANG = 'es_LA';

    const axiosPostMock = vi.mocked(axios.post);
    axiosPostMock.mockResolvedValueOnce({
      data: { messages: [{ id: 'wamid.otp_456' }] },
    });

    const result = await sendOTP('+56950572047', '987654');

    expect(result).toBe(true);
    expect(axiosPostMock).toHaveBeenCalled();
    const [, payload]: [any, any] = axiosPostMock.mock.calls[0] as any;

    expect(payload.type).toBe('template');
    expect(payload.template.name).toBe('zuriapp_auth_code');
    expect(payload.template.language.code).toBe('es_LA');
    expect(payload.template.components[0].parameters[0].text).toBe('987654');
  });
});

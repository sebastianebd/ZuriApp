import Staff from '../models/staff.model';
import * as redisConfig from '../config/redis.config';
import notificationService from './notification.service';
import jwt from 'jsonwebtoken';
import { PwaStaffProfileDTO, RequestOtpResponseDTO } from '../types/pwa-auth.types';
import logger from '../config/logger.config';

export const PORTAL_JWT_SECRET =
  process.env.JWT_PORTAL_SECRET || process.env.ACCESS_TOKEN_SECRET || 'zuriapp_pwa_secret_2026';

export const normalizeRut = (rut: string): string => {
  const cleaned = rut.replace(/[\.\s]/g, '').toUpperCase();
  if (!cleaned.includes('-') && cleaned.length >= 8) {
    const cuerpo = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    return `${cuerpo}-${dv}`;
  }
  return cleaned;
};

export const maskPhone = (phone?: string): string => {
  if (!phone) return 'tu número registrado';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return 'tu número registrado';
  const lastFour = digits.slice(-4);
  return `+56 9 •••• ${lastFour}`;
};

export class PwaAuthService {
  static async requestOtp(rut: string): Promise<RequestOtpResponseDTO> {
    const cleanRut = normalizeRut(rut);
    const rateLimitKey = `pwa:otp:ratelimit:${cleanRut}`;

    const attempts = await redisConfig.get(rateLimitKey);
    if (attempts && Number(attempts) >= 3) {
      const error: any = new Error('Has superado el límite de intentos. Por favor espera unos minutos.');
      error.status = 429;
      throw error;
    }

    const staff = await Staff.findOne({
      $or: [{ rut: rut.trim().toUpperCase() }, { rut: cleanRut }],
      isActive: true,
      isDeleted: { $ne: true },
    }).populate('positionId');

    if (!staff) {
      const error: any = new Error('Funcionario no encontrado o inactivo');
      error.status = 404;
      throw error;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `pwa:otp:${cleanRut}`;

    // TTL de 10 minutos (600s)
    await redisConfig.set(otpKey, otp, 600);

    const currentAttempts = attempts ? Number(attempts) : 0;
    await redisConfig.set(rateLimitKey, currentAttempts + 1, 600);

    logger.info(`[PWA-OTP] 📲 Código de verificación generado para ${cleanRut}: ${otp}`);

    const wasDelivered = await notificationService.sendOTP(staff.phone, otp);

    const maskedPhone = maskPhone(staff.phone);

    const message = wasDelivered
      ? 'Código de verificación enviado a tu número de WhatsApp.'
      : 'No fue posible entregar el mensaje por WhatsApp. Si estás en entorno local, revisa la consola del servidor.';

    return {
      success: true,
      message,
      maskedPhone,
      expiresInSeconds: 600,
      resendCooldownSeconds: 60,
      deliveryStatus: wasDelivered ? 'sent' : 'failed',
    };
  }

  static async verifyOtp(
    rut: string,
    otp: string
  ): Promise<{ token: string; profile: PwaStaffProfileDTO }> {
    const cleanRut = normalizeRut(rut);
    const otpKey = `pwa:otp:${cleanRut}`;

    const storedOtp = await redisConfig.get(otpKey);
    if (!storedOtp || storedOtp !== otp) {
      const error: any = new Error('Código de verificación inválido o expirado');
      error.status = 400;
      throw error;
    }

    await redisConfig.del(otpKey);

    const staff = await Staff.findOne({
      $or: [{ rut: rut.trim().toUpperCase() }, { rut: cleanRut }],
      isActive: true,
      isDeleted: { $ne: true },
    }).populate('positionId');

    if (!staff) {
      const error: any = new Error('Funcionario no encontrado o inactivo');
      error.status = 404;
      throw error;
    }

    const secret = PORTAL_JWT_SECRET;

    const token = jwt.sign(
      {
        staffId: staff._id.toString(),
        rut: staff.rut,
      },
      secret,
      { expiresIn: '30d' }
    );

    const position: any = staff.positionId;
    const profile: PwaStaffProfileDTO = {
      id: staff._id.toString(),
      rut: staff.rut,
      firstName: staff.firstName,
      lastName: staff.lastName,
      fullName: `${staff.firstName} ${staff.lastName}`.trim(),
      phone: staff.phone,
      email: staff.email,
      contractType: staff.contractType as any,
      positionId: position?._id ? position._id.toString() : (position?.toString() || ''),
      positionName: position?.name || '',
      estamento: position?.estamento || 'PROFESIONAL',
    };

    return { token, profile };
  }

  static async getMe(staffId: string): Promise<PwaStaffProfileDTO> {
    const staff = await Staff.findById(staffId).populate('positionId');
    if (!staff || !staff.isActive || staff.isDeleted) {
      const error: any = new Error('Funcionario no encontrado o inactivo');
      error.status = 404;
      throw error;
    }

    const position: any = staff.positionId;
    return {
      id: staff._id.toString(),
      rut: staff.rut,
      firstName: staff.firstName,
      lastName: staff.lastName,
      fullName: `${staff.firstName} ${staff.lastName}`.trim(),
      phone: staff.phone,
      email: staff.email,
      contractType: staff.contractType as any,
      positionId: position?._id ? position._id.toString() : (position?.toString() || ''),
      positionName: position?.name || '',
      estamento: position?.estamento || 'PROFESIONAL',
    };
  }
}

export default PwaAuthService;

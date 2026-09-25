import { z } from 'zod';

export const requestOtpSchema = z.object({
  body: z.object({
    rut: z
      .string()
      .min(8)
      .max(12)
      .regex(/^(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]|\d{7,8}-[\dkK])$/, 'Formato de RUT inválido'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    rut: z.string().min(8).max(12),
    otp: z
      .string()
      .length(6, 'El código OTP debe tener exactamente 6 dígitos')
      .regex(/^\d{6}$/, 'El OTP solo puede contener números'),
  }),
});

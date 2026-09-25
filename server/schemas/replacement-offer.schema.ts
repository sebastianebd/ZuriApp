import { z } from 'zod';

export const createReplacementOfferSchema = z.object({
  body: z.object({
    serviceId: z.string().min(1, 'El ID de servicio es requerido'),
    positionId: z.string().min(1, 'El ID de cargo es requerido'),
    id_saliente: z.string().min(1, 'El ID del funcionario saliente es requerido'),
    motivo: z.enum([
      'LICENCIA_MEDICA',
      'PRE_POST_NATAL',
      'PERMISO_ADMINISTRATIVO',
      'FERIADO_LEGAL',
      'DIA_COMPENSATORIO',
      'COMISION_SERVICIO',
      'PERMISO_GREMIAL',
      'OTRO',
    ]),
    observaciones: z.string().optional(),
    tipo_turno: z.string().min(1, 'El tipo de turno es requerido'),
    turn_type_id: z.string().optional(),
    fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
    fecha_termino: z.string().min(1, 'La fecha de término es requerida'),
    expiresAt: z.string().min(1, 'La fecha de expiración es requerida'),
  }),
});

export const awardOfferSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'El ID de la oferta es requerido'),
  }),
  body: z.object({
    targetStaffId: z.string().min(1, 'El ID del funcionario a adjudicar es requerido'),
  }),
});

export const applyOfferSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'El ID de la oferta es requerido'),
  }),
  body: z.object({
    notes: z.string().optional(),
  }).optional().default({}),
});

export const withdrawOfferSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'El ID de la oferta es requerido'),
  }),
});

export const cancelOfferSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'El ID de la oferta es requerido'),
  }),
  body: z.object({
    reason: z.string().optional(),
  }).optional().default({}),
});

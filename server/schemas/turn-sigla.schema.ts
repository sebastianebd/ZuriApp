import { z } from "zod";

// Schema base con todos los campos del modelo TurnSigla
const turnSiglaBodySchema = z.object({
  sigla: z
    .string()
    .min(1)
    .max(5)
    .transform((val) => val.toUpperCase()),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Color inválido"),
  turno_entrada: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .nullable(),
  turno_salida: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .nullable(),
  activo: z.boolean().default(true),
});

// Alias de compatibilidad (usado antes de la refactorización)
export const turnSiglaSchema = turnSiglaBodySchema;

// Schemas compatibles con validateSchema middleware (requieren wrapper body:/params:)
export const createTurnSiglaSchema = z.object({
  body: turnSiglaBodySchema,
});

export const updateTurnSiglaSchema = z.object({
  body: turnSiglaBodySchema.partial(),
  params: z.object({ id: z.string().min(1) }),
});

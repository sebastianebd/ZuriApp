import { z } from "zod";

export const serviceSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").trim(),
  jefe_servicio: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  supervisor: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  coordinadores: z.array(z.string()).optional(),
  jefes_turno: z.array(z.string()).optional(),
  centro_costo: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  ubicacion: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  anexo: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v)),
  activo: z.boolean().optional(),
});

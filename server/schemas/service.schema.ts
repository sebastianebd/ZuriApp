import { z } from "zod";
import { toTitleCase } from "../utils/formatters";

export const serviceSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").transform(toTitleCase),
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
    .transform((v) => {
      if (!v) return v === "" ? null : v;
      return toTitleCase(v);
    }),
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

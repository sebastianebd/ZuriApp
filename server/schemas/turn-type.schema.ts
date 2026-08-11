import { z } from "zod";

export const turnTypeSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").trim(),
  descripcion: z.string().optional(),
  alias: z.string().optional(),
  jornada: z.enum(["DIURNO", "NOCTURNO", "MIXTO"]).optional(),
  cantidad_dias: z.number().min(1, "Debe tener al menos 1 día"),
  secuencia: z
    .array(
      z.object({
        dia: z.number(),
        turno_entrada: z.string().nullable().optional(),
        turno_salida: z.string().nullable().optional(),
        es_libre: z.boolean(),
        sigla: z.string().min(1, "La sigla es requerida"),
        color: z
          .string()
          .regex(/^#([0-9A-F]{3}){1,2}$/i)
          .optional(),
      }),
    )
    .min(1, "La secuencia es requerida"),
  activo: z.boolean().optional(),
});

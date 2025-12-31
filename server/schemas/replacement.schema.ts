import { z } from "zod";

// Base rules reused across schemas
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "ID inválido");

export const createReplacementSchema = z.object({
  body: z.object({
    id_negocio: z.string().optional(),
    id_saliente: objectIdSchema,
    rut_saliente: z.string().min(8, "RUT saliente inválido"),
    nombre_saliente: z.string().min(2),
    apellido_saliente: z.string().min(2),
    id_entrante: objectIdSchema,
    rut_entrante: z.string().min(8, "RUT entrante inválido"),
    nombre_entrante: z.string().min(2),
    apellido_entrante: z.string().min(2),
    tipo_turno: z.string().min(1),
    fecha_inicio: z.coerce.date(),
    fecha_termino: z.coerce.date(),
    servicio: z.string().min(1),
    status: z
      .enum(["PENDIENTE", "APROBADO", "RECHAZADO", "FINALIZADO", "ANULADO"])
      .optional(),
    creado_por: objectIdSchema,
    corte_anticipado: z.boolean().optional(),
  }),
});

export const updateReplacementSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      rut_saliente: z.string().min(8).optional(),
      rut_entrante: z.string().min(8).optional(),
      fecha_inicio: z.coerce.date().optional(),
      fecha_termino: z.coerce.date().optional(),
      status: z
        .enum(["PENDIENTE", "APROBADO", "RECHAZADO", "FINALIZADO", "ANULADO"])
        .optional(),
      // Allow other fields as optional updates
    })
    .partial(),
});

export const substitutionSchema = z.object({
  body: z.object({
    id_registro_a: objectIdSchema,
    fecha_corte_a: z.coerce.date(),
    nuevo_entrante: z.object({
      id_entrante: objectIdSchema,
      rut_entrante: z.string().min(8, "RUT inválido"),
      nombre_entrante: z.string().min(2),
      apellido_entrante: z.string().min(2),
    }),
    datos_base_evento: z.object({
      id_evento_principal: z.string().min(1),
      id_saliente: objectIdSchema,
      rut_saliente: z.string().min(8),
      nombre_saliente: z.string().min(2),
      apellido_saliente: z.string().min(2),
      tipo_cargo: z.string().min(1),
      tipo_turno: z.string().min(1),
      servicio: z.string().min(1),
      fecha_termino_original: z.coerce.date(),
      // status, creado_por are derived or assumed from context?
      // service uses 'datos_base_evento.fecha_termino_original'
    }),
  }),
});

import { z } from "zod";
import { toTitleCase } from "../utils/formatters";

// --- Validadores Reutilizables ---
// Estandarizamos la validación de ObjectIDs de MongoDB para consistencia en todos los esquemas.
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "ID inválido");

/**
 * Esquema de Creación de Reemplazos
 * Define la estructura rigurosa requerida para iniciar un proceso de suplencia.
 * Se validan tanto los actores (Saliente/Entrante) como la temporalidad del evento.
 */
export const createReplacementSchema = z.object({
  body: z.object({
    id_negocio: z.string().optional(),
    id_saliente: objectIdSchema,
    rut_saliente: z.string().min(8, "RUT saliente inválido"),
    nombre_saliente: z.string().min(2).transform(toTitleCase),
    apellido_saliente: z.string().min(2).transform(toTitleCase),
    id_entrante: objectIdSchema,
    rut_entrante: z.string().min(8, "RUT entrante inválido"),
    nombre_entrante: z.string().min(2).transform(toTitleCase),
    apellido_entrante: z.string().min(2).transform(toTitleCase),
    tipo_turno: z.string().min(1),
    // Coerción de Fechas:
    // Zod transforma strings ISO8601 a objetos Date nativos automáticamente.
    // Esto asegura que el servicio reciba fechas válidas listas para operar.
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
      tipo_turno: z.string().min(1).optional(),
      servicio: z.string().min(1).optional(),
      fecha_inicio: z.coerce.date().optional(),
      fecha_termino: z.coerce.date().optional(),
      status: z
        .enum(["PENDIENTE", "APROBADO", "RECHAZADO", "FINALIZADO", "ANULADO"])
        .optional(),
      // Flexibilidad para actualizaciones parciales (PATCH)
      // Permitimos modificar campos específicos sin re-enviar todo el payload.
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
      nombre_entrante: z.string().min(2).transform(toTitleCase),
      apellido_entrante: z.string().min(2).transform(toTitleCase),
    }),
    datos_base_evento: z.object({
      id_evento_principal: z.string().min(1),
      id_saliente: objectIdSchema,
      rut_saliente: z.string().min(8),
      nombre_saliente: z.string().min(2).transform(toTitleCase),
      apellido_saliente: z.string().min(2).transform(toTitleCase),
      tipo_turno: z.string().min(1),
      servicio: z.string().min(1),
      fecha_termino_original: z.coerce.date(),
      // Contexto Derivado:
      // Campos como status o creado_por se infieren del contexto de la solicitud o del usuario autenticado,
      // por lo que no se exigen explícitamente en el payload de este endpoint específico.
    }),
  }),
});

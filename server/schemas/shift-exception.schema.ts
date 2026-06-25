import { z } from "zod";

/**
 * Validación para Excepciones de Turno
 * Permite la gestión de overrides manuales sobre la grilla de turnos (ej: cambios de última hora, licencias).
 */
export const createShiftExceptionSchema = z.object({
  body: z.object({
    assignment_id: z.string().min(1, "El ID de asignación es requerido"),
    // Soporte Dual de Fechas:
    // Aceptamos string ISO para facilitar la serialización desde el frontend, o Date object nativo.
    date: z.string().datetime().or(z.date()),
    original_type: z.string().min(1),
    override_type: z.string().min(1),
    reason: z.string().optional(),
    created_by: z.string().min(1, "El creador (created_by) es requerido"),
  }),
});

export type CreateShiftExceptionInput = z.infer<
  typeof createShiftExceptionSchema
>["body"];

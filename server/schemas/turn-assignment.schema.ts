import { z } from "zod";

/**
 * Esquema para Asignación de Roles/Turnos
 * Centraliza la validación de la grilla base de asignaciones.
 */
export const createTurnAssignmentSchema = z.object({
  body: z.object({
    staffId: z.string().min(1, "El usuario es obligatorio"),
    service: z.string().min(1, "El servicio es obligatorio"),
    turn_type: z.string().min(1, "El tipo de turno es obligatorio"),
    // DateTime Strict:
    // Exigimos formato ISO completo para evitar ambigüedades de zona horaria en la asignación.
    start_date: z.string().datetime(),
    end_date: z.string().datetime().optional(),
  }),
});

export const updateTurnAssignmentSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    staffId: z.string().optional(),
    service: z.string().optional(),
    turn_type: z.string().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  }),
});

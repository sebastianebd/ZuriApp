import { z } from "zod";

export const createTurnAssignmentSchema = z.object({
  body: z.object({
    user_id: z.string().min(1, "El usuario es obligatorio"),
    service: z.string().min(1, "El servicio es obligatorio"),
    turn_type: z.string().min(1, "El tipo de turno es obligatorio"),
    start_date: z.string().datetime(),
    end_date: z.string().datetime().optional(),
  }),
});

export const updateTurnAssignmentSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    user_id: z.string().optional(),
    service: z.string().optional(),
    turn_type: z.string().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  }),
});

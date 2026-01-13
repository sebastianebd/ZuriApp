import { z } from "zod";

export const createShiftExceptionSchema = z.object({
  body: z.object({
    assignment_id: z.string().min(1, "Assignment ID is required"),
    date: z.string().datetime().or(z.date()),
    override_type: z.enum(["LARGO", "NOCHE", "LIBRE"]),
    reason: z.string().optional(),
    created_by: z.string().min(1, "Created by is required"),
  }),
});

export type CreateShiftExceptionInput = z.infer<
  typeof createShiftExceptionSchema
>["body"];

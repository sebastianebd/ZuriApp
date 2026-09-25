import { z } from 'zod';

export const confirmShiftSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'El ID de asignación es requerido'),
  }),
  body: z.object({
    assignmentModel: z.enum(['TurnAssignment', 'Replacement']),
    date: z.string().min(1, 'La fecha es requerida'),
  }),
});

export const reportUnavailableSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'El ID de asignación es requerido'),
  }),
  body: z.object({
    assignmentModel: z.enum(['TurnAssignment', 'Replacement']),
    date: z.string().min(1, 'La fecha es requerida'),
    reason: z
      .string()
      .min(5, 'El motivo debe tener al menos 5 caracteres')
      .max(500, 'El motivo no puede exceder 500 caracteres'),
  }),
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    shiftReminders: z.boolean().optional(),
    shiftChanges: z.boolean().optional(),
    openCallsEnabled: z.boolean().optional(),
    preferredServices: z.array(z.string()).optional(),
    quietHours: z
      .object({
        enabled: z.boolean(),
        start: z.string(),
        end: z.string(),
      })
      .optional(),
  }),
});

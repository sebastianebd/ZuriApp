import { z } from 'zod';

export const resolveAlertSchema = z.object({
  resolutionNote: z
    .string()
    .trim()
    .min(5, 'La justificación debe tener al menos 5 caracteres'),
});

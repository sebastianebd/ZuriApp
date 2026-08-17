import { z } from "zod";
import { toTitleCase, toSentenceCase } from "../utils/formatters";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const positionBodySchema = z.object({
  name: z.string().min(1, "El nombre del cargo es requerido").transform(toTitleCase),
  position_code: z.string().min(1, "El código del cargo es requerido"),
  description: z.string().optional().transform((v) => (v ? toSentenceCase(v) : v)),
  isActive: z.boolean().default(true),
});

export const createPositionSchema = z.object({
  body: positionBodySchema,
});

export const updatePositionSchema = z.object({
  body: positionBodySchema.partial(),
  params: z.object({
    id: z.string().regex(objectIdPattern, "ID de cargo inválido"),
  }),
});

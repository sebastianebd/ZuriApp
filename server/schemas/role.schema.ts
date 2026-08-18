import { z } from "zod";
import { toTitleCase, toSentenceCase } from "../utils/formatters";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const roleBodySchema = z.object({
  name: z.string().min(1, "El nombre del rol es requerido").transform(toTitleCase),
  code: z.string().min(1, "El código del rol es requerido").transform((v) => v.toUpperCase()),
  level: z.number().int().min(0, "El nivel debe ser un número positivo"),
  permissions: z.array(z.string()).default([]),
  hasSystemAccess: z.boolean().default(false),
  description: z.string().optional().transform((v) => (v ? toSentenceCase(v) : v)),
});

export const createRoleSchema = z.object({
  body: roleBodySchema,
});

export const updateRoleSchema = z.object({
  body: roleBodySchema.partial(),
  params: z.object({
    id: z.string().regex(objectIdPattern, "ID de rol inválido"),
  }),
});

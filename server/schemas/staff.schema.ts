import { z } from "zod";
import { toTitleCase } from "../utils/formatters";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Validaciones de Rutina de Personal (Staff)
 */
export const createStaffSchema = z.object({
  body: z.object({
    rut: z.string().min(1, "El RUT es requerido").min(8, "RUT inválido"),
    firstName: z
      .string()
      .min(1, "El nombre es requerido")
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .transform(toTitleCase),
    lastName: z
      .string()
      .min(1, "El apellido es requerido")
      .min(2, "El apellido debe tener al menos 2 caracteres")
      .transform(toTitleCase),
    email: z
      .string()
      .min(1, "El email es requerido")
      .email("Formato de email inválido"),
    birthDate: z.coerce.date({ message: "La fecha de nacimiento es requerida o inválida" }),
    contractType: z.enum(["CONTRATA", "PLANTA", "HONORARIO"], {
      message: "El tipo de contrato seleccionado no es válido"
    }),
    address: z.string().optional().transform((v) => (v ? toTitleCase(v) : v)),
    phone: z
      .string()
      .regex(/^\+?[0-9]{8,15}$/, "Teléfono inválido")
      .optional(),
    city: z.string().optional().transform((v) => (v ? toTitleCase(v) : v)),
    roleId: z.string().regex(objectIdPattern, "ID de Rol inválido"),
    positionId: z.string().regex(objectIdPattern, "ID de Cargo inválido").optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateStaffSchema = z.object({
  body: createStaffSchema.shape.body.partial(),
  params: z.object({
    id: z.string().regex(objectIdPattern, "ID de personal inválido"),
  }),
});

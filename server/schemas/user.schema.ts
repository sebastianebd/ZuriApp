import { z } from "zod";

export const createUserSchema = z.object({
  body: z.object({
    rut: z.string().min(1, "El RUT es requerido").min(8, "RUT inválido"),
    nombre: z
      .string()
      .min(1, "El nombre es requerido")
      .min(2, "El nombre debe tener al menos 2 caracteres"),
    apellido: z
      .string()
      .min(1, "El apellido es requerido")
      .min(2, "El apellido debe tener al menos 2 caracteres"),
    email: z
      .string()
      .min(1, "El email es requerido")
      .email("Formato de email inválido"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .optional(),
    fecha_nac: z.coerce.date(),
    direccion: z.string().optional(),
    telefono: z
      .string()
      .regex(/^\+?[0-9]{8,15}$/, "Teléfono inválido")
      .optional(),
    ciudad: z.string().optional(),
    tipo_cargo: z.string().min(1, "El tipo de cargo es requerido"),
  }),
});

export const updateUserSchema = z.object({
  body: createUserSchema.shape.body.partial().extend({
    habilitado: z.string().optional(),
    servicio: z.string().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de usuario inválido"),
  }),
});

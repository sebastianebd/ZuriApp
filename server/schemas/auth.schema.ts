import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    rut: z.string().min(1, "El RUT es requerido"),
    password: z.string().min(1, "La contraseña es requerida"),
  }),
});

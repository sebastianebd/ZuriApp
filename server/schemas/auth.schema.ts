import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    rut: z.string().min(1, "El RUT es requerido"),
    password: z.string().min(1, "La contraseña es requerida"),
  }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, "La contraseña actual es requerida"),
      newPassword: z
        .string()
        .min(6, "Debe tener al menos 6 caracteres")
        .max(8, "No puede tener más de 8 caracteres")
        .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
        .regex(/[a-z]/, "Debe contener al menos una minúscula")
        .regex(/[0-9]/, "Debe contener al menos un número")
        .regex(
          /[@#$%&*\-_+=!?]/,
          "Debe contener al menos un carácter especial (@#$%&*-+=!?)"
        ),
      confirmPassword: z.string().min(1, "Confirma la nueva contraseña"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Las contraseñas no coinciden",
      path: ["confirmPassword"],
    }),
});

import { z } from "zod";

/**
 * Validaciones de Rutina de Usuarios
 * Incluye reglas de negocio complejas como la exención de ciertos campos (habilitado)
 * basada en roles específicos, usando `superRefine`.
 */
export const createUserSchema = z.object({
  body: z
    .object({
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
      habilitado: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      // Regla de Negocio: Habilitación por Cargo
      // Los cargos administrativos de alto nivel (RRHH, ADMIN-TI) están implícitamente habilitados
      // o gestionados por políticas separadas. Para el resto (TENS, Enfermeras), el estado
      // debe ser explícito para evitar usuarios "flotantes" no asignables.
      const cargosExentos = ["RECURSOS HUMANOS", "ADMIN-TI"];

      if (!cargosExentos.includes(data.tipo_cargo) && !data.habilitado) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El estado habilitado es requerido para este cargo",
          path: ["habilitado"],
        });
      }
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

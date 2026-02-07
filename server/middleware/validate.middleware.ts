import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Middleware de Validación de Esquema (Zod)
 * Actúa como un gatekeeper antes de llegar al controlador, asegurando que los datos
 * cumplan estrictamente el contrato definido. Esto elimina validaciones repetitivas
 * dentro de la lógica de negocio.
 */
export const validateSchema =
  (schema: ZodSchema<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // ParseAsync permite validaciones asíncronas si el esquema lo requiere (ej: checks de unicidad)
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Normalización de errores para consumo frontend uniforme
        return res.status(400).json({
          mensaje: "Error de validación",
          errores: error.issues.map((e) => ({
            campo: e.path.join("."),
            mensaje: e.message,
          })),
        });
      }
      return res.status(500).json({ mensaje: "Error interno de validación" });
    }
  };

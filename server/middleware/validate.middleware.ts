import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateSchema =
  (schema: ZodSchema<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
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

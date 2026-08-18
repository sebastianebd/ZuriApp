import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

/**
 * Factory de middleware para validar que un parámetro de ruta es un MongoDB ObjectId válido.
 * Previene CastError de Mongoose (que devolvería 500) retornando 400 con mensaje claro.
 *
 * @param paramName - Nombre del parámetro de ruta a validar (default: "id")
 */
export function validateObjectId(paramName = "id") {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName];

    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
      return res.status(400).json({
        success: false,
        message: `Parámetro '${paramName}' no es un ID válido`,
      });
    }

    next();
  };
}

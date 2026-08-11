import { Request, Response, NextFunction } from "express";
import logger from "../config/logger.config";
import { AppError } from "../errors/app-error";

/**
 * Manejador Global de Errores
 * Centraliza la captura de excepciones no controladas para evitar fugas de información técnica
 * al cliente en producción (Stack Traces), manteniendo logs detallados internamente.
 */
function errorHandlerMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction, // Requerido por Express para identificarlo como Error Handler
) {
  logger.error(`❌ Error: ${err.message}`, { stack: err.stack });

  const status = err.status || 500;
  
  const isOperational = err instanceof AppError;
  const message = isOperational
    ? err.message
    : (process.env.NODE_ENV === "development" ? err.message : "Error interno del servidor");

  // Encolamos la respuesta segura.
  // En Desarrollo exponemos el stack para debugging rápido.
  res.status(status).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}

export default errorHandlerMiddleware;

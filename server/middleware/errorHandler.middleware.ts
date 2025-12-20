import { Request, Response, NextFunction } from "express";
import logger from "../config/logger.config";

function errorHandlerMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(`❌ Error: ${err.message}`, { stack: err.stack });

  const status = err.status || 500;
  const message = err.message || "Error interno del servidor";

  res.status(status).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}

export default errorHandlerMiddleware;

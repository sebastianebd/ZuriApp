import { Request, Response, NextFunction } from "express";
import allowedOrigins from "../config/allowedOrigins.config";

/**
 * Middleware de Credenciales CORS
 * Verifica si el origen de la solicitud está en la lista blanca y, de ser así,
 * inyecta los encabezados necesarios para permitir cookies en solicitudes cross-origin
 * (Access-Control-Allow-Credentials).
 */
function credentialsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }

  next();
}

export default credentialsMiddleware;

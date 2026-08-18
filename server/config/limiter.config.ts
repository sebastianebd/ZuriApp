import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

const isProduction = process.env.NODE_ENV === "production";

// Middleware "No-Op" para Desarrollo
// Evita bloquear al desarrollador durante pruebas intensivas o recargas automáticas.
const dummyLimiter = (req: Request, res: Response, next: NextFunction) =>
  next();

// Limitador Global
// Protección básica contra ataques de Denegación de Servicio (DoS) y scraping agresivo.
// Aplica a todas las rutas de la API.
const globalLimiter = isProduction
  ? rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      limit: 100, // Límite relajado para uso general
      standardHeaders: true, // Retorna info de límites en headers `RateLimit-*` (Draft-7)
      legacyHeaders: false, // Deshabilita headers `X-RateLimit-*` obsoletos
      message:
        "Demasiadas peticiones desde esta IP, por favor intente nuevamente en 15 minutos.",
    })
  : dummyLimiter;

// Limitador de Autenticación (Login/Register)
// Política estricta para prevenir ataques de fuerza bruta o Credential Stuffing.
// 5 intentos cada 15 minutos es suficiente para usuarios legítimos pero bloquea bots.
const authLimiter = isProduction
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message:
        "Demasiados intentos de inicio de sesión, por favor intente nuevamente en 15 minutos.",
    })
  : dummyLimiter;

export { globalLimiter, authLimiter };

// generalLimiter: alias de globalLimiter para rutas públicas y proxies de terceros.
// ponytail: mismo límite que globalLimiter (100 req/15min) — suficiente para ICS y Sentry tunnel.
export const generalLimiter = globalLimiter;

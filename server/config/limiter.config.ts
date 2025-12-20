import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

const isProduction = process.env.NODE_ENV === "production";

const dummyLimiter = (req: Request, res: Response, next: NextFunction) =>
  next();

const globalLimiter = isProduction
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message:
        "Demasiadas peticiones desde esta IP, por favor intente nuevamente en 15 minutos.",
    })
  : dummyLimiter;

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

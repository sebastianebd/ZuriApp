const rateLimit = require("express-rate-limit");

const isProduction = process.env.NODE_ENV === "production";

// Middleware "dummy" para desarrollo/test
const dummyLimiter = (req, res, next) => next();

// Limiter Global: Protección general (DoS, scraping)
const globalLimiter = isProduction
  ? rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // Límite de 100 peticiones por IP por ventana
      standardHeaders: true, // Retorna info de límites en los headers `RateLimit-*`
      legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
      message: {
        message:
          "Demasiadas peticiones desde esta IP, por favor intente nuevamente en 15 minutos.",
      },
    })
  : dummyLimiter;

// Limiter Auth: Protección estricta para Login (Fuerza bruta)
// Limiter Auth: Protección estricta para Login (Fuerza bruta)
const authLimiter = isProduction
  ? rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // Límite de 5 intentos fallidos/exitosos por IP
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message:
          "Demasiados intentos de inicio de sesión, por favor intente nuevamente en 15 minutos.",
      },
    })
  : dummyLimiter;

module.exports = {
  globalLimiter,
  authLimiter,
};

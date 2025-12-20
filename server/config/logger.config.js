const winston = require("winston");
require("winston-daily-rotate-file");

const { combine, timestamp, printf, colorize } = winston.format;

// Formato personalizado: Fecha [NIVEL]: Mensaje
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const logger = winston.createLogger({
  level: "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
  transports: [
    // 1. Mostrar en consola con colores (útil para dev)
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    // 2. Guardar en archivo con rotación diaria
    new winston.transports.DailyRotateFile({
      filename: "logs/application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true, // Comprimir logs viejos
      maxSize: "20m", // Max 20MB por archivo
      maxFiles: "14d", // Mantener solo 14 días
    }),
  ],
});

module.exports = logger;

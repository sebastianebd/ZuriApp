import winston from "winston";
import "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize } = winston.format;

// Formato de Log Estructurado
// "YYYY-MM-DD HH:mm:ss [LEVEL]: message"
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Configuración de Logger Centralizado (Winston)
// Provee múltiples transportes (Console, File) y rotación automática para gestión de disco.
const logger = winston.createLogger({
  level: "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
  transports: [
    // 1. Consola: logs coloreados para desarrollo y visualización en tiempo real (ej: Railway logs)
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    // 2. Archivo Rotativo: logs persistentes para auditoría y debug post-mortem.
    // - Rota diariamente para fácil organización.
    // - Comprime logs antiguos (gzip) para ahorrar espacio.
    // - Elimina logs mayores a 14 días para cumplimiento de GDPR/políticas de retención.
    new winston.transports.DailyRotateFile({
      filename: "logs/application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }) as unknown as winston.transport,
  ],
});

export default logger;

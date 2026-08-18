import dotenv from "dotenv";
// Carga de Variables de Entorno
// Se invoca tempranamente para asegurar que process.env esté poblado antes de cualquier otra importación.
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Sanity Check en Producción
if (isProduction) {
  const requiredEnvVars = [
    "DATABASE_URI",
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
    "SENTRY_DSN",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET_NAME",
  ];

  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `CRITICAL ERROR: Faltan variables de entorno obligatorias en producción: ${missing.join(", ")}`
    );
  }
}

// Abstracción de Configuración
// Centraliza el acceso a variables críticas, permitiendo validación y tipado,
// evitando el uso disperso de 'process.env' en toda la aplicación.
export default {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 3500,
  DATABASE_URI: process.env.DATABASE_URI as string,
  
  // AWS S3
  AWS_REGION: process.env.AWS_REGION || "sa-east-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
  AWS_ENDPOINT: process.env.AWS_ENDPOINT, // Solo para MinIO en dev
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || "zuriapp-reportes",
  
  // Redis
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  
  // Resend / Email
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SMTP_FROM: process.env.SMTP_FROM || '"Soporte ZuriApp" <onboarding@resend.dev>',
  
  // Sentry
  SENTRY_DSN: process.env.SENTRY_DSN,

  // BullMQ Dashboard Auth
  BULL_BOARD_USER: process.env.BULL_BOARD_USER || "admin",
  BULL_BOARD_PASS: process.env.BULL_BOARD_PASS || "admin",
};

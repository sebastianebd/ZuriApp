import dotenv from "dotenv";

dotenv.config();

export const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure:
    process.env.SMTP_SECURE === "true" ||
    (process.env.SMTP_SECURE !== "false" && process.env.SMTP_PORT === "465"), // Default true only for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  from: process.env.SMTP_FROM || '"Soporte ZuriApp" <no-reply@zuriapp.cl>',
};

// Config Check
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn(
    "⚠️  ADVERTENCIA DE EMAIL: No se han detectado 'SMTP_USER' o 'SMTP_PASS' en las variables de entorno."
  );
  console.warn(
    "    Asegúrate de agregarlas en tu archivo .env activo (ya sea en la raíz o en /server)."
  );
}

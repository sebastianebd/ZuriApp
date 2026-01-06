export const emailConfig = {
  resendApiKey:
    process.env.RESEND_API_KEY || "re_BwZrd2sa_DDhYh9stq2phM1d8QotCirEF", // Fallback for dev/testing
  from: process.env.SMTP_FROM || '"Soporte ZuriApp" <onboarding@resend.dev>', // Default to Resend test domain
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

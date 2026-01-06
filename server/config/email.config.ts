export const emailConfig = {
  resendApiKey: process.env.RESEND_API_KEY,
  from: process.env.SMTP_FROM || '"Soporte ZuriApp" <onboarding@resend.dev>', // Default to Resend test domain
};

// Config Check
if (!process.env.RESEND_API_KEY) {
  console.warn(
    "⚠️  ADVERTENCIA DE EMAIL: No se ha detectado 'RESEND_API_KEY' en las variables de entorno."
  );
  console.warn(
    "    El envío de correos fallará. Agrégala en tu archivo .env o en Railway."
  );
}

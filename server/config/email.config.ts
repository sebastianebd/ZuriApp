// Configuración de Email (Resend)
// Centraliza las credenciales y el remitente por defecto para garantizar consistencia
// en todas las comunicaciones transaccionales.
export const emailConfig = {
  resendApiKey: process.env.RESEND_API_KEY,
  // Remitente por Defecto
  // En desarrollo, usamos el dominio de pruebas de Resend ('onboarding@resend.dev').
  // En producción, esto DEBE ser reemplazado por un dominio verificado (ej: 'soporte@zuriapp.cl').
  from: process.env.SMTP_FROM || '"Soporte ZuriApp" <onboarding@resend.dev>',
};

// Verificación de Sanidad (Health Check) al inicio
// Advierte inmediatamente si falta la configuración crítica de correo,
// evitando fallos silenciosos en tiempo de ejecución cuando se intente enviar un email.
if (!process.env.RESEND_API_KEY) {
  console.warn(
    "⚠️  ADVERTENCIA DE EMAIL: No se ha detectado 'RESEND_API_KEY' en las variables de entorno.",
  );
  console.warn(
    "    El envío de correos fallará. Agrégala en tu archivo .env o en Railway.",
  );
}

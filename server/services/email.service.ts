import { Resend } from "resend";
import { emailConfig } from "../config/email.config";
import logger from "../config/logger.config";

// --- Inicialización de Resend ---
// Inicializamos el cliente de correo solo si existe una API Key.
// Esto permite arrancar el servidor en entornos de desarrollo local sin configurar credenciales de email reales.
let resend: Resend | null = null;
if (emailConfig.resendApiKey) {
  resend = new Resend(emailConfig.resendApiKey);
} else {
  logger.warn(
    "[EmailService] RESEND_API_KEY no encontrada. El envío de correos está deshabilitado.",
  );
}

// --- Templates ---
// Definimos templates HTML funcionales directamente en código para mantener simplicidad y portabilidad
// sin requerir un motor de vistas complejo. El diseño es responsive y profesional.
const getWelcomeTemplate = (nombre: string, rut: string, resetLink: string, isReset = false) => {
  const title = isReset ? "Restablecer Contraseña" : "Bienvenido a ZuriApp";
  const heading = isReset ? "Restablecer Contraseña" : "Bienvenido a ZuriApp";
  const intro = isReset
    ? `El administrador ha solicitado restablecer tu contraseña en ZuriApp.`
    : `Se ha creado exitosamente tu cuenta administrativa en el sistema de gestión ZuriApp.`;
  const action = isReset
    ? "Haz clic en el botón para establecer tu nueva contraseña."
    : "Haz clic en el botón para configurar tu contraseña y activar tu cuenta.";
  const btnText = isReset ? "Restablecer Contraseña" : "Activar Cuenta";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background-color: #0d6efd; padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
    .content { padding: 40px; color: #333333; line-height: 1.6; }
    .info-box { background-color: #f8f9fa; border-left: 4px solid #0d6efd; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
    .button { display: inline-block; background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
    .expiry { font-size: 13px; color: #888; margin-top: 16px; }
    strong { color: #0d6efd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${heading}</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>${intro}</p>
      <p>${action}</p>
      
      <div class="info-box">
        <p style="margin: 5px 0;"><strong>Usuario (RUT):</strong> ${rut}</p>
      </div>

      <div style="text-align: center;">
        <a href="${resetLink}" class="button">${btnText}</a>
      </div>
      <p class="expiry">Este enlace es válido por <strong>24 horas</strong>. Si no solicitaste esto, ignora este correo.</p>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático, por favor no responder a este correo.</p>
      <p>&copy; ${new Date().getFullYear()} ZuriApp. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
};

// --- Métodos del Servicio ---

const sendWelcomeEmail = async (
  to: string,
  nombre: string,
  rut: string,
  resetLink: string,
  isReset = false,
) => {
  const htmlContent = getWelcomeTemplate(nombre, rut, resetLink, isReset);
  const subject = isReset
    ? "ZuriApp - Restablecer Contraseña"
    : "Bienvenido a ZuriApp - Activa tu cuenta";
  try {
    if (!resend) {
      logger.warn(
        `[EmailService] Saltando envío a ${to} (Sin API Key configurada)`,
      );
      return null;
    }

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [to],
      subject,
      html: htmlContent,
    });

    if (error) {
      logger.error("Resend API Error:", error);
      throw new Error(`Resend Error: ${error.message}`);
    }

    logger.info(
      `Email enviado exitosamente vía Resend a ${to}. ID: ${data?.id}`,
    );
    return data;
  } catch (error: any) {
    // Propagación de Error:
    // Lanzamos el error para que BullMQ (si se usa) pueda reintentar el trabajo más tarde (estrategia de Retry).
    logger.error(`Falló envío de email a ${to}:`, error.message);
    throw error;
  }
};

export default {
  sendWelcomeEmail,
};

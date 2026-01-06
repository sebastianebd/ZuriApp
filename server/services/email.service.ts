import { Resend } from "resend";
import { emailConfig } from "../config/email.config";
import logger from "../config/logger.config";

// --- Resend Initialization ---
let resend: Resend | null = null;
if (emailConfig.resendApiKey) {
  resend = new Resend(emailConfig.resendApiKey);
} else {
  logger.warn("[EmailService] RESEND_API_KEY missing. Email sending disabled.");
}

// --- Templates ---
// Professional HTML Template
const getWelcomeTemplate = (nombre: string, rut: string, pass: string) => {
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
    .credentials-box { background-color: #f8f9fa; border-left: 4px solid #0d6efd; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
    .button { display: inline-block; background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
    strong { color: #0d6efd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bienvenido a ZuriApp</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Se ha creado exitosamente tu cuenta administrativa en el sistema de gestión ZuriApp.</p>
      <p>A continuación encontrarás tus credenciales de acceso temporal:</p>
      
      <div class="credentials-box">
        <p style="margin: 5px 0;"><strong>Usuario (RUT):</strong> ${rut}</p>
        <p style="margin: 5px 0;"><strong>Contraseña:</strong> ${pass}</p>
      </div>

      <p>Por seguridad, te recomendamos cambiar tu contraseña al ingresar por primera vez.</p>
      
      <div style="text-align: center;">
        <a href="https://tudominio.cl" class="button">Ir al Sistema</a>
      </div>
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

// --- Service Methods ---

export const sendWelcomeEmail = async (
  to: string,
  nombre: string,
  rut: string,
  pass: string
) => {
  const htmlContent = getWelcomeTemplate(nombre, rut, pass);

  try {
    if (!resend) {
      logger.warn(
        `[EmailService] Skipping email to ${to} (No API Key configured)`
      );
      return null;
    }

    const { data, error } = await resend.emails.send({
      from: emailConfig.from, // e.g., "onboarding@resend.dev" or your verified domain
      to: [to],
      subject: "Bienvenido a ZuriApp - Credenciales de Acceso",
      html: htmlContent,
    });

    if (error) {
      logger.error("Resend API Error:", error);
      throw new Error(`Resend Error: ${error.message}`);
    }

    logger.info(`Email sent successfully via Resend to ${to}. ID: ${data?.id}`);
    return data;
  } catch (error: any) {
    logger.error(`Failed to send email to ${to}:`, error.message);
    throw error; // Propagate to BullMQ for retry
  }
};

export default {
  sendWelcomeEmail,
};

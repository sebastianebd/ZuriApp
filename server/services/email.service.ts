import nodemailer from "nodemailer";
import { emailConfig } from "../config/email.config";
import logger from "../config/logger.config";

// --- Transporter Initialization ---
const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: {
    user: emailConfig.auth.user,
    pass: emailConfig.auth.pass,
  },
  // Resilience Settings
  connectionTimeout: 20000, // 20s
  greetingTimeout: 20000, // 20s
  socketTimeout: 20000, // 20s
  // Debugging
  logger: true,
  debug: true,
});

logger.info(
  `[EmailService] Configured Transporter: Host=${emailConfig.host}, Port=${emailConfig.port}, Secure=${emailConfig.secure}, User=${emailConfig.auth.user}`
);

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    logger.warn("Email Service: Connection failed", error);
  } else {
    logger.info("Email Service: Server is ready to take our messages");
  }
});

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

  const mailOptions = {
    from: emailConfig.from,
    to: to,
    subject: "Bienvenido a ZuriApp - Credenciales de Acceso",
    html: htmlContent,
  };

  // Let the error propagate so BullMQ can handle retries
  const info = await transporter.sendMail(mailOptions);
  logger.info(`Email sent to ${to}: ${info.messageId}`);
  return info;
};

export default {
  sendWelcomeEmail,
};

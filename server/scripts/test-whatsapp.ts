import dotenv from "dotenv";
import path from "path";

// Load .env file explicitly (Try root .env first, then server .env)
const rootEnv = path.resolve(__dirname, "../../.env");
dotenv.config({ path: rootEnv });

import notificationService from "../services/notification.service";
import logger from "../config/logger.config";

async function main() {
  const targetNumber = process.argv[2];

  if (!targetNumber) {
    console.error(
      "❌ Por favor, proporciona un número de teléfono como argumento."
    );
    console.error("Ejemplo: npx ts-node scripts/test-whatsapp.ts +56912345678");
    process.exit(1);
  }

  console.log(`📱 Intentando enviar mensaje de prueba a: ${targetNumber}`);
  console.log(`🔑 Usando Phone ID: ${process.env.WHATSAPP_PHONE_ID}`);

  try {
    const success = await notificationService.sendWhatsApp(
      targetNumber,
      "👋 Hola! Esta es una prueba de integración de ZuriApp con WhatsApp API."
    );

    if (success) {
      console.log("✅ ¡Mensaje enviado con éxito! Revisa tu WhatsApp.");
    } else {
      console.error("❌ Falló el envío del mensaje. Revisa los logs arriba.");
    }
  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
}

main();

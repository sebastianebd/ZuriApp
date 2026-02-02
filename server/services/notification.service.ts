import logger from "../config/logger.config";
import userService from "./user.service";
import { IReplacement } from "../models/replacement.model";
import axios from "axios";

/**
 * Service to handle notifications (WhatsApp, Email, etc.)
 */

// Helper to generate Frontend Calendar Link
const generateFrontendLink = (userId: string, date?: Date): string => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  let link = `${baseUrl}/mi-calendario?uid=${userId}`;

  if (date) {
    link += `&month=${date.getMonth() + 1}&year=${date.getFullYear()}`;
  }

  return link;
};

// Environment variables for WhatsApp Cloud API
const WHATSAPP_VERSION = "v18.0"; // Or latest version

async function sendWhatsApp(to: string, message: string) {
  // Read env vars dynamically to allow dotenv to load first in scripts
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    logger.warn(
      "[WhatsApp] Missing configuration (WHATSAPP_TOKEN or WHATSAPP_PHONE_ID). Returning without sending.",
    );
    return false;
  }

  try {
    // Meta requires the phone number without the '+' for the "to" field usually,
    // but accepts standard international format. Let's ensure it's clean.
    // ZuriApp format: +569XXXXXXXX. Meta often expects 569XXXXXXXX.
    const cleanTo = to.replace("+", "").replace(/\s/g, "");

    const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${WHATSAPP_PHONE_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "text",
      text: {
        preview_url: true, // Show preview for the calendar link
        body: message,
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    logger.info(
      `[WhatsApp] Message sent to ${to}. Message ID: ${response.data.messages?.[0]?.id}`,
    );
    return true;
  } catch (error: any) {
    logger.error(
      `[WhatsApp] Error sending message to ${to}: ${
        error.response?.data?.error?.message || error.message
      }`,
    );
    // Log full error for debugging integration
    if (error.response?.data) {
      logger.error(
        `[WhatsApp] Meta API Error Details: ${JSON.stringify(
          error.response.data,
        )}`,
      );
    }
    return false;
  }
}

async function notifyReplacement(replacement: IReplacement) {
  try {
    // 1. Get the Incoming User (Entrante) to get their phone number
    const entranteId = replacement.id_entrante.toString();
    const userEntrante: any = await userService.obtenerPorId(entranteId);

    if (!userEntrante || !userEntrante.telefono) {
      logger.warn(
        `[NotifyReplacement] Skipping notification. User ${entranteId} not found or has no phone.`,
      );
      return;
    }

    // 2. Format the message
    const nombreEntrante = `${userEntrante.nombre} ${userEntrante.apellido}`;
    const nombreSaliente = `${replacement.nombre_saliente} ${replacement.apellido_saliente}`;

    const startDisplay = new Date(replacement.fecha_inicio).toLocaleString(
      "es-CL",
      { timeZone: "America/Santiago" },
    );
    const endDisplay = new Date(replacement.fecha_termino).toLocaleString(
      "es-CL",
      { timeZone: "America/Santiago" },
    );

    // Generate Public Calendar Link with Month Lock
    const publicLink = generateFrontendLink(
      userEntrante._id.toString(),
      new Date(replacement.fecha_inicio),
    );

    const message =
      `👋 Hola *${nombreEntrante}*, tienes un nuevo reemplazo asignado.\n\n` +
      `👤 *Reemplazas a:* ${nombreSaliente}\n` +
      `🏥 *Servicio:* ${replacement.servicio}\n` +
      `📅 *Desde:* ${startDisplay}\n` +
      `📅 *Hasta:* ${endDisplay}\n` +
      `🕒 *Turno:* ${replacement.tipo_turno}\n\n` +
      `👇 *Revisa tu calendario aquí:*\n` +
      `${publicLink}`;

    // 4. Send
    await sendWhatsApp(userEntrante.telefono, message);
  } catch (error) {
    logger.error(`[NotifyReplacement] Error sending notification: ${error}`);
  }
}

async function notifyShiftAssignment(assignment: any) {
  try {
    // 1. Get the User
    // Assignment usually has user_id populated, but let's be safe.
    let user = assignment.user_id;

    // Determine the ID string safely
    const userIdString = user._id ? user._id.toString() : user.toString();

    // If user object is incomplete (missing phone or service) or just an ID, fetch fresh
    if (!user.telefono || !user.servicio) {
      user = await userService.obtenerPorId(userIdString);
    }

    if (!user || !user.telefono) {
      logger.warn(
        `[NotifyShiftAssignment] Skipping notification. User not found or has no phone.`,
      );
      return;
    }

    // 2. Format
    const nombreUsuario = `${user.nombre} ${user.apellido}`;
    const startDisplay = new Date(assignment.start_date).toLocaleDateString(
      "es-CL",
      { timeZone: "America/Santiago" },
    );
    // Determine end date display
    let endDisplay = "Indefinido";
    if (assignment.end_date) {
      endDisplay = new Date(assignment.end_date).toLocaleDateString("es-CL", {
        timeZone: "America/Santiago",
      });
    }

    const calendarLink = generateFrontendLink(user._id || user.id);

    const message =
      `👋 Hola *${nombreUsuario}*, se te han asignado nuevos turnos.\n\n` +
      `📋 *Tipo de Turno:* ${assignment.turn_type_name || "Asignado"}\n` +
      `🏥 *Servicio:* ${assignment.service || user.servicio || "No especificado"}\n` +
      `📅 *Inicio:* ${startDisplay}\n` +
      `📅 *Termino:* ${endDisplay}\n\n` +
      `👇 *Revisa el detalle en tu calendario:*\n` +
      `${calendarLink}`;

    // 3. Send
    await sendWhatsApp(user.telefono, message);
  } catch (error) {
    logger.error(
      `[NotifyShiftAssignment] Error sending notification: ${error}`,
    );
  }
}

export default {
  notifyReplacement,
  notifyShiftAssignment,
  sendWhatsApp,
};

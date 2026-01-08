import logger from "../config/logger.config";
import userService from "./user.service";
import { IReplacement } from "../models/replacement.model";

/**
 * Service to handle notifications (WhatsApp, Email, etc.)
 */

// Helper to generate Native Calendar Link (ICS Download)
const generateIcsLink = (replacementId: string): string => {
  // Use API_URL or BACKEND_URL from env if available (e.g. https://api.zuriapp.com)
  // Fallback to CLIENT_URL or localhost if not set.
  const baseUrl =
    process.env.API_URL ||
    process.env.BACKEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:3500";
  // Ensure no trailing slash
  const cleanBase = baseUrl.replace(/\/$/, "");
  return `${cleanBase}/api/calendar/view/${replacementId}`;
};

import axios from "axios";

// Environment variables for WhatsApp Cloud API
const WHATSAPP_VERSION = "v18.0"; // Or latest version

async function sendWhatsApp(to: string, message: string) {
  // Read env vars dynamically to allow dotenv to load first in scripts
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    logger.warn(
      "[WhatsApp] Missing configuration (WHATSAPP_TOKEN or WHATSAPP_PHONE_ID). Returning without sending."
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
      `[WhatsApp] Message sent to ${to}. Message ID: ${response.data.messages?.[0]?.id}`
    );
    return true;
  } catch (error: any) {
    logger.error(
      `[WhatsApp] Error sending message to ${to}: ${
        error.response?.data?.error?.message || error.message
      }`
    );
    // Log full error for debugging integration
    if (error.response?.data) {
      logger.error(
        `[WhatsApp] Meta API Error Details: ${JSON.stringify(
          error.response.data
        )}`
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
        `[NotifyReplacement] Skipping notification. User ${entranteId} not found or has no phone.`
      );
      return;
    }

    // 2. Format the message
    // Structure:
    // "Hola {nombre}, tienes un nuevo reemplazo asignado."
    // "Reemplazas a: {nombre_saliente} {apellido_saliente}"
    // "Fecha: {inicio} - {fin}"
    // "Servicio: {servicio}"
    // "Turno: {tipo_turno}"
    // "Agrégalo a tu calendario: {link}"

    const nombreEntrante = `${userEntrante.nombre} ${userEntrante.apellido}`;
    const nombreSaliente = `${replacement.nombre_saliente} ${replacement.apellido_saliente}`;

    // Formatting dates for readability in message (e.g., DD/MM/YYYY HH:mm)
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Chile/Continental", // or America/Santiago, strictly. 'Chile/Continental' is deprecated on some systems, using fallback or best guess.
      // Actually, let's use standard JS toLocaleString with 'es-CL' and timeZone 'America/Santiago'
    };

    // Note: servers often run in UTC. We should ensure we display the time correctly.
    // The codebase seems to store Dates. Let's assume standard handling.
    const startDisplay = new Date(replacement.fecha_inicio).toLocaleString(
      "es-CL",
      { timeZone: "America/Santiago" }
    );
    const endDisplay = new Date(replacement.fecha_termino).toLocaleString(
      "es-CL",
      { timeZone: "America/Santiago" }
    );

    // 3. Generate Calendar Link (Native ICS)
    const calendarLink = generateIcsLink(replacement._id as string);

    const message =
      `Hola *${nombreEntrante}*, se te ha asignado un *NUEVO REEMPLAZO*.\n\n` +
      `👤 *Reemplazas a:* ${nombreSaliente}\n` +
      `🏥 *Servicio:* ${replacement.servicio}\n` +
      `🕒 *Turno:* ${replacement.tipo_turno}\n` +
      `📅 *Inicio:* ${startDisplay}\n` +
      `📅 *Termino:* ${endDisplay}\n\n` +
      `Por favor, confirma tu asistencia en el sistema.\n\n` +
      `📅 *Agendar en Calendario:* ${calendarLink}`;

    // 4. Send
    await sendWhatsApp(userEntrante.telefono, message);
  } catch (error) {
    logger.error(`[NotifyReplacement] Error sending notification: ${error}`);
    // Do not throw, we don't want to break the main flow
  }
}

export default {
  notifyReplacement,
  sendWhatsApp,
};

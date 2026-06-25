import logger from "../config/logger.config";
import userService from "./user.service";
import { IReplacement } from "../models/replacement.model";
import axios from "axios";

/**
 * Servicio de Notificaciones Multicanal.
 * Actualmente centrado en WhatsApp Business API (Meta) para alertas críticas de turnos y reemplazos.
 */

// Helper: Generador de Links Frontend
// Centralizamos la construcción de URLs para garantizar que los deep-links apuntan
// correctamente al entorno desplegado (o localhost en dev).
const generateFrontendLink = (userId: string, date?: Date): string => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  let link = `${baseUrl}/mi-calendario?uid=${userId}`;

  if (date) {
    link += `&month=${date.getMonth() + 1}&year=${date.getFullYear()}`;
  }

  return link;
};

// Configuración API Meta
const WHATSAPP_VERSION = "v18.0";

async function sendWhatsApp(to: string, message: string) {
  // Leemos env vars dinámicamente para asegurar que estén disponibles en tiempo de ejecución,
  // especialmente útil en scripts de seeding o workers que inicializan distintos contextos.
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    logger.warn(
      "[WhatsApp] Falta configuración (WHATSAPP_TOKEN o WHATSAPP_PHONE_ID). Envío omitido.",
    );
    return false;
  }

  try {
    // Sanitización de Teléfono:
    // Meta / WhatsApp API es estricta con los formatos.
    // ZuriApp almacena +569XXXXXXXX, pero la API suele preferir el formato raw sin '+'
    // aunque soporta internacional. Limpiamos espacios y símbolos para maximizar compatibilidad.
    const cleanTo = to.replace("+", "").replace(/\s/g, "");

    const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${WHATSAPP_PHONE_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "text",
      text: {
        preview_url: true, // Permitimos preview para que el usuario vea 'ZuriApp' en el link
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
      `[WhatsApp] Mensaje enviado a ${to}. ID: ${response.data.messages?.[0]?.id}`,
    );
    return true;
  } catch (error: any) {
    // Manejo de Errores de Integración:
    // No lanzamos excepción para no romper el flujo de negocio que llamó a la notificación.
    // Solo logueamos el error detallado de Meta para debugging.
    logger.error(
      `[WhatsApp] Error enviando a ${to}: ${
        error.response?.data?.error?.message || error.message
      }`,
    );

    if (error.response?.data) {
      logger.error(
        `[WhatsApp] Detalle Error Meta API: ${JSON.stringify(
          error.response.data,
        )}`,
      );
    }
    return false;
  }
}

async function notifyReplacement(replacement: IReplacement) {
  try {
    // 1. Obtención de Datos del Destinatario (Entrante)
    // Es vital confirmar que tenemos un número de teléfono válido antes de intentar construir el mensaje.
    const entranteId = replacement.id_entrante.toString();
    const userEntrante: any = await userService.obtenerPorId(entranteId);

    if (!userEntrante || !userEntrante.telefono) {
      logger.warn(
        `[NotifyReplacement] Omitiendo notificación. Usuario ${entranteId} no encontrado o sin teléfono.`,
      );
      return;
    }

    // 2. Formateo y Construcción de Mensaje
    // Usamos templates literales claros con emojis para mejorar la legibilidad rápida en móvil.
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

    // Deep Link al Calendario Específico
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

    // 3. Envío
    await sendWhatsApp(userEntrante.telefono, message);
  } catch (error) {
    logger.error(`[NotifyReplacement] Error general en notificación: ${error}`);
  }
}

async function notifyShiftAssignment(assignment: any) {
  try {
    // 1. Resolución de Usuario
    // La asignación puede venir con el objeto de usuario populado o solo el ID.
    // Normalizamos esto para asegurar acceso a propiedades críticas (teléfono).
    let user = assignment.user_id;

    const userIdString = user._id ? user._id.toString() : user.toString();

    // Si el objeto está incompleto (ej: populado parcialmente), re-fesechamos.
    if (!user.telefono || !user.servicio) {
      user = await userService.obtenerPorId(userIdString);
    }

    if (!user || !user.telefono) {
      logger.warn(
        `[NotifyShiftAssignment] Omitiendo notificación. Usuario sin teléfono o no encontrado.`,
      );
      return;
    }

    // 2. Formateo
    const nombreUsuario = `${user.nombre} ${user.apellido}`;
    const startDisplay = new Date(assignment.start_date).toLocaleDateString(
      "es-CL",
      { timeZone: "America/Santiago" },
    );

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

    // 3. Envío
    await sendWhatsApp(user.telefono, message);
  } catch (error) {
    logger.error(
      `[NotifyShiftAssignment] Error general en notificación: ${error}`,
    );
  }
}

export default {
  notifyReplacement,
  notifyShiftAssignment,
  sendWhatsApp,
};

import replacementService from "../services/replacement.service";

/**
 * Servicio para gestionar las integraciones de calendario (ICS, Webcal).
 */

const formatDateICS = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

async function generateIcs(id: string) {
  const replacement: any = await replacementService.obtenerPorId(id);

  if (!replacement) return null;

  const start = new Date(replacement.fecha_inicio);
  const end = new Date(replacement.fecha_termino);
  const now = new Date();

  const summary = `Reemplazo: ${replacement.servicio} (${replacement.tipo_turno})`;
  const description = `Reemplazas a: ${replacement.nombre_saliente} ${replacement.apellido_saliente}\\nTurno: ${replacement.tipo_turno}\\nServicio: ${replacement.servicio}`;
  const location = replacement.servicio;

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ZuriApp//Reemplazos v1.0//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${replacement._id}@zuriapp.com`,
    "SEQUENCE:0",
    `DTSTAMP:${formatDateICS(now)}`,
    `DTSTART:${formatDateICS(start)}`,
    `DTEND:${formatDateICS(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return icsContent;
}

async function generateEventHtml(id: string, requestHost: string | undefined) {
  const replacement: any = await replacementService.obtenerPorId(id);

  if (!replacement) return null;

  const start = new Date(replacement.fecha_inicio);
  const end = new Date(replacement.fecha_termino);

  let host = requestHost;
  const envUrl = process.env.API_URL || process.env.BACKEND_URL;

  if (envUrl) {
    try {
      const url = new URL(envUrl);
      host = url.host;
    } catch (e) {
      // Ignorar URL inválida en env, usar fallback
    }
  }

  const webcalUrl = `webcal://${host}/api/calendar/ics/${id}?t=${Date.now()}`;

  const startDisplay = start.toLocaleString("es-CL", {
    timeZone: "America/Santiago",
  });
  const endDisplay = end.toLocaleString("es-CL", {
    timeZone: "America/Santiago",
  });

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmar Reemplazo</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 90%; width: 400px; text-align: center; }
        h1 { color: #333; font-size: 1.5rem; margin-bottom: 0.5rem; }
        .badge { background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem; font-weight: 600; display: inline-block; margin-bottom: 1.5rem; }
        .details { text-align: left; margin-bottom: 2rem; color: #555; background: #f9fafb; padding: 1rem; border-radius: 8px; }
        .details p { margin: 0.5rem 0; }
        .btn { display: block; width: 100%; box-sizing: border-box; padding: 0.85rem; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; margin-bottom: 1rem; transition: background 0.2s; }
        .btn-primary { background-color: #4f46e5; color: white; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.4); } 
        .btn-primary:hover { background-color: #4338ca; }
        
        .footer { margin-top: 1rem; font-size: 0.75rem; color: #888; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Nuevo Reemplazo Asignado</h1>
        <span class="badge">${replacement.servicio}</span>
        
        <div class="details">
          <p><strong>Reemplazas a:</strong> ${replacement.nombre_saliente} ${replacement.apellido_saliente}</p>
          <p><strong>Turno:</strong> ${replacement.tipo_turno}</p>
          <p><strong>Inicio:</strong> ${startDisplay}</p>
          <p><strong>Término:</strong> ${endDisplay}</p>
        </div>

        <a href="${webcalUrl}" class="btn btn-primary">📅 Agregar a mi Calendario</a>
        
        <div class="footer">
          Al tocar el botón, tu celular debería abrir la app de Calendario y pedirte confirmación para guardar el evento.
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

export default {
  generateIcs,
  generateEventHtml,
};

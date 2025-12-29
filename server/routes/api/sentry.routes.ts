import { Router, Request, Response } from "express";
import axios from "axios";
import logger from "../../config/logger.config";

const router = Router();

// Endpoint para el tunnel de Sentry
// POST /api/sentry/tunnel
router.post("/tunnel", async (req: Request, res: Response) => {
  try {
    const envelope = req.body;
    // Sentry envía un envelope (texto plano con saltos de línea JSON)
    // Normalmente express.json() ya lo parseó si vino como JSON, pero
    // Sentry envía text/plain o application/x-sentry-envelope.
    // Necesitamos asegurarnos de recibir el body crudo si es posible,
    // pero intentemos manejarlo con lo que tenemos.

    // NOTA PROFESIONAL: La implementación robusta requiere parsear el envelope
    // para extraer el DSN y validar que el proyecto sea el nuestro (whitelist).
    // Por simplicidad inicial: enviaremos todo a Sentry.

    // Para simplificar en Express sin cambiar body-parsers globales conflictivos:
    // Asumimos que el cliente envía datos y nosotros re-enviamos.
    // Sin embargo, la forma más limpia es leer el DSN del envelope header.

    // Dado que Express + JSON parser puede complicar la lectura de raw body,
    // Manejamos Buffer, String u Object
    let envelopeText = "";

    if (Buffer.isBuffer(envelope)) {
      envelopeText = envelope.toString("utf8");
    } else if (typeof envelope === "string") {
      envelopeText = envelope;
    } else if (typeof envelope === "object") {
      // Si por alguna razón llegó como objeto, tratamos de stringificarlo o sacar el header
      // Pero con express.raw() esto no debería pasar.
      envelopeText = JSON.stringify(envelope);
    }

    const pieces = envelopeText.split("\n");
    let header: any =
      pieces.length > 0 && pieces[0] ? JSON.parse(pieces[0]) : {};

    const dsn = header.dsn;

    if (!dsn) {
      // Intento desesperado: ver si el objeto original tenía dsn
      if ((envelope as any)?.dsn) {
        // caso raro donde express.json ganó la carrera
        header = envelope;
      } else {
        throw new Error(
          `No DSN found. Body Type: ${typeof envelope}, IsBuffer: ${Buffer.isBuffer(
            envelope
          )}, Content: ${envelopeText.substring(0, 100)}...`
        );
      }
    }

    // Recalculamos dsn por si cayó en el "Intento desesperado"
    const finalDsn = header.dsn || (envelope as any)?.dsn;
    if (!finalDsn) throw new Error("DSN really missing");

    const { host, pathname } = new URL(finalDsn);
    const projectId = pathname.replace("/", "");
    const sentryUrl = `https://${host}/api/${projectId}/envelope/`; // Endpoint de ingestión oficial

    // Reenviar a Sentry
    await axios.post(sentryUrl, envelope, {
      headers: {
        "Content-Type": "application/x-sentry-envelope",
      },
      params: {
        // Pasamos las credenciales públicas que venían en el query original del cliente
        // Pero como estamos tuneleando, idealmente el sobre ya trae la auth.
        // Sentry recomienda solo hacer POST del body al endpoint de envelope.
      },
    });

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    logger.error("Error tunneling to Sentry:", error);
    return res.status(500).json({
      error: "Tunnel failed",
      details: error instanceof Error ? error.message : String(error),
      debug: {
        contentType: req.headers["content-type"],
        bodyType: typeof req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        bodyLength: req.body ? JSON.stringify(req.body).length : 0,
      },
    });
  }
});

export default router;

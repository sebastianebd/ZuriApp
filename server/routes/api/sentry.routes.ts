import { Router, Request, Response } from "express";
import axios from "axios";
import logger from "../../config/logger.config";

const router = Router();

// --- Sentry Tunneling ---
// Propósito: Bypass de Ad-Blockers y prevención de CORS Issues.
// Los navegadores modernos a menudo bloquean solicitudes directas a dominios de rastreo (ingest.sentry.io).
// Este endpoint actúa como un proxy reverso ligero que reenvía los eventos desde nuestro dominio.
router.post("/tunnel", async (req: Request, res: Response) => {
  try {
    const envelope = req.body;

    let envelopeText = "";

    // Manejo robusto de tipos de entrada (Buffer vs String vs JSON Object)
    if (Buffer.isBuffer(envelope)) {
      envelopeText = envelope.toString("utf8");
    } else if (typeof envelope === "string") {
      envelopeText = envelope;
    } else if (typeof envelope === "object") {
      envelopeText = JSON.stringify(envelope);
    }

    const pieces = envelopeText.split("\n");
    let header: any =
      pieces.length > 0 && pieces[0] ? JSON.parse(pieces[0]) : {};

    const dsn = header.dsn;

    // Validación de DSN (Data Source Name)
    if (!dsn) {
      if ((envelope as any)?.dsn) {
        header = envelope;
      } else {
        throw new Error(
          `No DSN found. Body Type: ${typeof envelope}, IsBuffer: ${Buffer.isBuffer(
            envelope,
          )}, Content: ${envelopeText.substring(0, 100)}...`,
        );
      }
    }

    const finalDsn = header.dsn || (envelope as any)?.dsn;
    if (!finalDsn) throw new Error("DSN really missing");

    const { host, pathname } = new URL(finalDsn);
    const projectId = pathname.replace("/", "");
    const sentryUrl = `https://${host}/api/${projectId}/envelope/`; // Endpoint de ingestión oficial

    // Reenvío del Envelope a la infraestructura de Sentry
    await axios.post(sentryUrl, envelope, {
      headers: {
        "Content-Type": "application/x-sentry-envelope",
      },
      params: {},
    });

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    logger.error("Error tunneling to Sentry:", error);
    return res.status(500).json({
      error: "Tunnel failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

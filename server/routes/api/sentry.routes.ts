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
    // vamos a confiar en que la data viene en req.body si el content-type es correcto
    // o necesitamos usar express.text() solo para esta ruta.

    // Parsear el envelope para obtener el DSN correcto (Frontend Project)
    const pieces = typeof envelope === "string" ? envelope.split("\n") : [];
    const header = pieces.length > 0 ? JSON.parse(pieces[0]) : {};

    // Si el envelope trae DSN, lo usamos. Si no, error.
    const dsn = header.dsn;

    if (!dsn) {
      throw new Error("No DSN found in envelope header");
    }

    const { host, pathname } = new URL(dsn);
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
    });
  }
});

export default router;

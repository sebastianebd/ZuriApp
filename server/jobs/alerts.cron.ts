import cron from "node-cron";
import logger from "../config/logger.config";
import alertService from "../services/alert.service";
import * as Sentry from "@sentry/node";

/**
 * Cronjob de Evaluación Diaria de Alertas Operativas (OPS-01).
 * Se dispara todos los días a las 06:00 AM (0 6 * * *).
 * Barre la ventana de los próximos 7 días para todos los servicios activos
 * detectando déficits de dotación y auto-resolviendo alertas si el puesto fue cubierto.
 */
cron.schedule("0 6 * * *", async () => {
  try {
    logger.info(
      "[AlertsCron] ⏰ Iniciando barrido diario programado de alertas (06:00 AM)...",
    );
    const result = await alertService.evaluateAllDaily();
    logger.info(
      `[AlertsCron] ✅ Barrido finalizado. Servicios evaluados: ${result.evaluatedServices}, Nuevas alertas: ${result.newAlerts}, Auto-resueltas: ${result.autoResolved}`,
    );
  } catch (error: any) {
    logger.error(
      `[AlertsCron] ❌ Error en el barrido diario de alertas: ${error.message}`,
    );
    Sentry.captureException(error);
  }
});

logger.info(
  "[AlertsCron] Cronjob de evaluación de alertas registrado (diario a las 06:00 AM)",
);

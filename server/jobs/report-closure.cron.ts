import cron from "node-cron";
import dayjs from "dayjs";
import logger from "../config/logger.config";
import { reportClosureQueue } from "../queues/report.queue";
import * as Sentry from "@sentry/node";

/**
 * Cronjob de Cierre Mensual Automático.
 * Se dispara el día 5 de cada mes a las 00:00 hrs.
 * Inserta un job en la cola BullMQ para procesar el cierre del mes ANTERIOR.
 *
 * Expresión cron: 0 0 5 * *
 *   ┌─── minuto (0)
 *   │ ┌─── hora (0 = medianoche)
 *   │ │ ┌─── día del mes (5)
 *   │ │ │ ┌─── mes (* = todos)
 *   │ │ │ │ ┌─── día de la semana (* = todos)
 *   0 0 5 * *
 */
cron.schedule("0 0 5 * *", async () => {
  try {
    // El mes a cerrar es el mes anterior al día 5 en que se dispara
    const targetMonth = dayjs().subtract(1, "month");
    const month = targetMonth.month() + 1; // dayjs.month() es 0-indexed
    const year = targetMonth.year();

    logger.info(
      `[ReportCron] 🗓️ Iniciando cierre automático del período ${month}/${year}`,
    );

    const job = await reportClosureQueue.add("monthly-closure", {
      month,
      year,
    });

    logger.info(
      `[ReportCron] ✅ Job ${job.id} encolado para cierre de ${month}/${year}`,
    );
  } catch (error: any) {
    logger.error(`[ReportCron] ❌ Error al encolar el cierre mensual: ${error.message}`);
    Sentry.captureException(error);
  }
});

logger.info("[ReportCron] Cronjob de cierre mensual registrado (día 5 de cada mes a las 00:00)");

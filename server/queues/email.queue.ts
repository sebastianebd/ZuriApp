import { Queue, Worker, Job } from "bullmq";
import emailService from "../services/email.service";
import logger from "../config/logger.config";
import bullmqConnection from "../config/bullmq-connection";
import * as Sentry from "@sentry/node";

const QUEUE_NAME = "email-queue";

// 1. Definición de la Cola (Producer)
// Centraliza la configuración de comportamiento de los trabajos encolados.
export const emailQueue = new Queue(QUEUE_NAME, {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3, // Resiliencia: Reintentar hasta 3 veces ante fallos transitorios (ej: timeout SMTP)
    backoff: {
      type: "exponential", // Estrategia de espera incremental (1s, 2s, 4s) para no saturar al proveedor
      delay: 1000,
    },
    removeOnComplete: 100, // Mantenimiento: Conservar historial limitado para depuración sin llenar memoria
    removeOnFail: 50,
  },
});

// 2. Definición del Worker (Consumer)
// Proceso en segundo plano que desacopla el envío de correos del ciclo de request/response HTTP principal.
export const setupEmailWorker = () => {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      logger.info(`[EmailWorker] Procesando trabajo ${job.id}: ${job.name}`);
      const { to, nombre, rut, resetLink, isReset } = job.data;

      // Delegación al servicio de negocio
      await emailService.sendWelcomeEmail(to, nombre, rut, resetLink, isReset);

      // Seguridad en Logs: no loguear el link (contiene el token)
      await job.updateData({
        ...job.data,
        resetLink: "[REDACTED]",
      });

      logger.info(`[EmailWorker] Trabajo ${job.id} completado exitosamente`);
    },
    {
      connection: bullmqConnection,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error(
      `[EmailWorker] Trabajo ${job?.id} falló con error: ${err.message}`,
    );
    Sentry.captureException(err);
  });

  logger.info(
    `[EmailWorker] Worker inicializado y escuchando en '${QUEUE_NAME}'`,
  );
  return worker;
};

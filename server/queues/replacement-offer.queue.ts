import { Queue, Worker, Job } from "bullmq";
import logger from "../config/logger.config";
import bullmqConnection from "../config/bullmq-connection";
import ReplacementOfferService from "../services/replacement-offer.service";

export const REPLACEMENT_OFFER_QUEUE = "replacement-offer-queue";

export const replacementOfferQueue = new Queue(REPLACEMENT_OFFER_QUEUE, {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

export const setupReplacementOfferWorker = () => {
  const worker = new Worker(
    REPLACEMENT_OFFER_QUEUE,
    async (job: Job) => {
      logger.info(`[ReplacementOfferWorker] Procesando job ${job.id}: ${job.name}`);
      const { offerId } = job.data;
      if (job.name === "expireOffer" && offerId) {
        await ReplacementOfferService.processOfferExpiration(offerId);
      }
    },
    { connection: bullmqConnection }
  );

  worker.on("completed", (job: Job) => {
    logger.info(`[ReplacementOfferWorker] Job ${job.id} completado exitosamente`);
  });

  worker.on("failed", (job: Job | undefined, err: Error) => {
    logger.error(`[ReplacementOfferWorker] Job ${job?.id} falló: ${err.message}`, { stack: err.stack });
  });

  return worker;
};

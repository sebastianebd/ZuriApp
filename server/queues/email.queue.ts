import { Queue, Worker, Job } from "bullmq";
import emailService from "../services/email.service";
import logger from "../config/logger.config";

// Redis connection details (reuse from env or config)
const redisConnection: any = {
  host: "localhost", // Default for dev when running locally
  port: 6379,
};

// Docker environment adjustment
if (process.env.REDIS_URL) {
  const url = new URL(process.env.REDIS_URL);
  redisConnection.host = url.hostname;
  redisConnection.port = Number(url.port);
  redisConnection.password = url.password;
  redisConnection.username = url.username;
}

const QUEUE_NAME = "email-queue";

// 1. Queue Definition (Producer)
export const emailQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry 3 times
    backoff: {
      type: "exponential",
      delay: 1000, // 1s, 2s, 4s...
    },
    removeOnComplete: 100, // Keep last 100 completed jobs for inspection
    removeOnFail: 50, // Keep last 50 failed jobs for inspection
  },
});

// 2. Worker Definition (Consumer)
export const setupEmailWorker = () => {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      logger.info(`[EmailWorker] Processing job ${job.id}: ${job.name}`);
      const { to, nombre, rut, pass } = job.data;

      // Call the actual service
      await emailService.sendWelcomeEmail(to, nombre, rut, pass);

      // Mask sensitive data in the job log so it's not visible in Dashboard
      await job.updateData({
        ...job.data,
        rut: "XX.XXX.XXX-X", // Masked
        pass: "******", // Masked
      });

      logger.info(`[EmailWorker] Job ${job.id} completed successfully`);
    },
    {
      connection: redisConnection,
    }
  );

  worker.on("failed", (job, err) => {
    logger.error(
      `[EmailWorker] Job ${job?.id} failed with error: ${err.message}`
    );
  });

  logger.info(
    `[EmailWorker] Worker initialized and listening on '${QUEUE_NAME}'`
  );
  return worker;
};

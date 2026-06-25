import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import corsOptions from "./config/cors.config";
import credentialsMiddleware from "./middleware/credentials.middleware";
import errorHandlerMiddleware from "./middleware/errorHandler.middleware";
import { globalLimiter } from "./config/limiter.config";

import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "./config/swagger.config";

import morgan from "morgan";
import logger from "./config/logger.config";

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { emailQueue } from "./queues/email.queue";
import basicAuth from "express-basic-auth";

import authRoutes from "./routes/api/auth.routes";
import userRoutes from "./routes/api/users.routes";
import replacementRoutes from "./routes/api/replacement.routes";
import optionRoutes from "./routes/api/options.routes";
import cargoRoutes from "./routes/api/cargo.routes";
import auditRoutes from "./routes/api/audit.routes";
import profileRoutes from "./routes/api/profile.routes";

import "./jobs/replacement.cron";
// Token personalizado de Morgan para incluir el nombre del Usuario autenticado en los logs.
// Esto mejora la trazabilidad vinculando las solicitudes directamente a usuarios específicos.
morgan.token("user", (req: Request) => {
  if (req.user) {
    const user = req.user;
    const name = `${user.nombre} ${user.apellido}`;
    return `[User: ${name}]`;
  }
  return "[Anon]";
});

const app = express();

// Trust Proxy: Requerido cuando se ejecuta detrás de un proxy inverso (como Nginx en Railway/AWS).
// Asegura que req.ip refleje la IP real del cliente en lugar de la IP del proxy.
app.set("trust proxy", 1);

app.use(credentialsMiddleware);
app.use(cors(corsOptions));
app.use(globalLimiter);
// Logging: Usar formato combinado + token de usuario personalizado.
// Omitir logging para el polling del dashboard de BullMQ para reducir ruido.
app.use(
  morgan(
    ":remote-addr :user :method :url :status :res[content-length] - :response-time ms",
    {
      stream: { write: (message: string) => logger.info(message.trim()) },
      skip: (req: Request) => req.url.startsWith("/admin/queues"),
    },
  ),
);
// Tunnel de Sentry: Debe asumir manejo de cuerpo crudo (raw body).
// Capturamos el cuerpo como buffer ("50mb") para evitar corrupción de análisis antes de reenviar a Sentry.
app.use("/api/sentry", express.raw({ limit: "50mb", type: () => true }));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
import calendarRoutes from "./routes/api/calendar.routes";

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reemplazos", replacementRoutes);
app.use("/api/options", optionRoutes);
app.use("/api/cargos", cargoRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/calendar", calendarRoutes);
import turnAssignmentRoutes from "./routes/api/turn-assignment.routes";
app.use("/api/assignments", turnAssignmentRoutes);
app.use("/api/assignments", turnAssignmentRoutes);
import shiftExceptionRoutes from "./routes/api/shift-exception.routes";
app.use("/api/shift-exceptions", shiftExceptionRoutes);

import serviceRoutes from "./routes/api/service.routes";
import turnTypeRoutes from "./routes/api/turn-type.routes";
import turnSiglaRoutes from "./routes/api/turn-sigla.routes";

app.use("/api/services", serviceRoutes);
app.use("/api/turn-types", turnTypeRoutes);
app.use("/api/turn-siglas", turnSiglaRoutes);

import sentryRoutes from "./routes/api/sentry.routes";
app.use(
  "/api/sentry",
  express.text({
    type: ["application/json", "application/x-sentry-envelope", "text/plain"],
    limit: "50mb",
  }),
  sentryRoutes,
);

import reportRoutes from "./routes/api/report.routes";
app.use("/api/reports", reportRoutes);

// --- Configuración de Bull Board ---
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter,
});

// Proteger Dashboard con Basic Auth para prevenir acceso público a datos de trabajos.
const dashboardUser = process.env.BULL_BOARD_USER;
const dashboardPass = process.env.BULL_BOARD_PASS;

app.use(
  "/admin/queues",
  basicAuth({
    users: { [dashboardUser as string]: dashboardPass as string },
    challenge: true,
  }),
  serverAdapter.getRouter(),
);

import publicRoutes from "./routes/api/public.routes";
app.use("/api/public", publicRoutes);

app.all("*", (req: Request, res: Response) => {
  res.status(404).json({ error: "404 Not Found" });
});

import * as Sentry from "@sentry/node";
Sentry.setupExpressErrorHandler(app);

app.use(errorHandlerMiddleware);

export default app;

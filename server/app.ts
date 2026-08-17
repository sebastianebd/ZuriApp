import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import corsOptions from "./config/cors.config";
import errorHandlerMiddleware from "./middleware/errorHandler.middleware";
import { globalLimiter } from "./config/limiter.config";
import helmet from "helmet";

import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "./config/swagger.config";

import morgan from "morgan";
import logger from "./config/logger.config";
import env from "./config/env.config";

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { emailQueue } from "./queues/email.queue";
import {
  reportClosureQueue,
  setupReportClosureWorker,
} from "./queues/report.queue";
import basicAuth from "express-basic-auth";
import * as Sentry from "@sentry/node";

import "./jobs/replacement.cron";
import "./jobs/report-closure.cron";

// IMPORT HOISTING
import authRoutes from "./routes/api/auth.routes";
import publicRoutes from "./routes/api/public.routes";
import shiftExceptionRoutes from "./routes/api/shift-exception.routes";
import staffRoutes from "./routes/api/staff.routes";
import accountRoutes from "./routes/api/account.routes";
import roleRoutes from "./routes/api/role.routes";
import positionRoutes from "./routes/api/position.routes";
import replacementRoutes from "./routes/api/replacement.routes";
import auditRoutes from "./routes/api/audit.routes";
import profileRoutes from "./routes/api/profile.routes";
import calendarRoutes from "./routes/api/calendar.routes";
import turnAssignmentRoutes from "./routes/api/turn-assignment.routes";
import serviceRoutes from "./routes/api/service.routes";
import turnTypeRoutes from "./routes/api/turn-type.routes";
import turnSiglaRoutes from "./routes/api/turn-sigla.routes";
import sentryRoutes from "./routes/api/sentry.routes";
import reportRoutes from "./routes/api/report.routes";
import periodRoutes from "./routes/api/period.routes";

// Inicializar Worker de cierre mensual (escucha la cola BullMQ)
setupReportClosureWorker();

// Token personalizado de Morgan para incluir el nombre del Usuario autenticado en los logs.
// Esto mejora la trazabilidad vinculando las solicitudes directamente a usuarios específicos.
morgan.token("user", (req: Request) => {
  if (req.staff) {
    const staff = req.staff;
    const name = `${staff.firstName} ${staff.lastName}`;
    return `[Staff: ${name}]`;
  }
  return "[Anon]";
});

const app = express();

// Trust Proxy: Requerido cuando se ejecuta detrás de un proxy inverso (como Nginx en Railway/AWS).
// Asegura que req.ip refleje la IP real del cliente en lugar de la IP del proxy.
app.set("trust proxy", 1);

// Seguridad HTTP - Inyectar cabeceras defensivas (HSTS, NoSniff, X-Frame-Options)
app.use(helmet());

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

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use("/api/auth", authRoutes);
app.use("/api/reemplazos", replacementRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/shift-exceptions", shiftExceptionRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/assignments", turnAssignmentRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/turn-types", turnTypeRoutes);
app.use("/api/turn-siglas", turnSiglaRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/periods", periodRoutes);

// Sentry Tunnel (Consolidado y Unificado)
app.use(
  "/api/sentry",
  express.text({
    type: ["application/json", "application/x-sentry-envelope", "text/plain"],
    limit: "50mb",
  }),
  sentryRoutes,
);

// --- Configuración de Bull Board ---
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(reportClosureQueue), // Cierre mensual — visible en /admin/queues
  ],
  serverAdapter: serverAdapter,
});

// Proteger Dashboard con Basic Auth para prevenir acceso público a datos de trabajos.
const dashboardUser = env.BULL_BOARD_USER;
const dashboardPass = env.BULL_BOARD_PASS;

app.use(
  "/admin/queues",
  basicAuth({
    users: { [dashboardUser]: dashboardPass },
    challenge: true,
  }),
  serverAdapter.getRouter(),
);

app.all("*", (req: Request, res: Response) => {
  res.status(404).json({ error: "404 Not Found" });
});

Sentry.setupExpressErrorHandler(app);

app.use(errorHandlerMiddleware);

export default app;

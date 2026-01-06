import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import corsOptions from "./config/cors.config";
import credentialsMiddleware from "./middleware/credentials.middleware";
import errorHandlerMiddleware from "./middleware/errorHandler.middleware";
import { globalLimiter } from "./config/limiter.config";

// Swagger
import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "./config/swagger.config";

// Logging
import morgan from "morgan";
import logger from "./config/logger.config";

// Bull Board
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { emailQueue } from "./queues/email.queue";
import basicAuth from "express-basic-auth";

import authRoutes from "./routes/api/auth.routes";
import userRoutes from "./routes/api/users.routes";
import replacementRoutes from "./routes/api/replacement.routes";
import optionRoutes from "./routes/api/options.routes";
import auditRoutes from "./routes/api/audit.routes";
import profileRoutes from "./routes/api/profile.routes";

import "./jobs/replacement.cron"; // Import execution

// Definir token personalizado para Morgan
morgan.token("user", (req: Request) => {
  if (req.user) {
    const user = req.user;
    const name = `${user.nombre} ${user.apellido}`;
    return `[User: ${name}]`;
  }
  return "[Anon]";
});

const app = express();

// Confiar en el proxy (Nginx) para obtener la IP real
app.set("trust proxy", 1);

app.use(credentialsMiddleware);
app.use(cors(corsOptions));
app.use(globalLimiter);
// Usar formato combinado + usuario
app.use(
  morgan(
    ":remote-addr :user :method :url :status :res[content-length] - :response-time ms",
    {
      stream: { write: (message: string) => logger.info(message.trim()) },
      skip: (req: Request) => req.url.startsWith("/admin/queues"),
    }
  )
);
// Sentry Tunnel Body Parser (Capturar todo como buffer crudo para evitar corrupción)
app.use("/api/sentry", express.raw({ limit: "50mb", type: () => true }));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Documentación API
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reemplazos", replacementRoutes);
app.use("/api/options", optionRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/profile", profileRoutes);

// Sentry Tunnel - Debe ir antes del catch-all *
import sentryRoutes from "./routes/api/sentry.routes";
// El envelope de Sentry es text/plain o application/x-sentry-envelope
app.use(
  "/api/sentry",
  express.text({
    type: ["application/json", "application/x-sentry-envelope", "text/plain"],
    limit: "50mb",
  }),
  sentryRoutes
);

// --- Bull Board Setup ---
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter,
});

// Protect Dashboard with Basic Auth
const dashboardUser = process.env.BULL_BOARD_USER || "admin";
const dashboardPass = process.env.BULL_BOARD_PASS || "admin123";

app.use(
  "/admin/queues",
  basicAuth({
    users: { [dashboardUser]: dashboardPass },
    challenge: true,
  }),
  serverAdapter.getRouter()
);
// ------------------------

app.all("*", (req: Request, res: Response) => {
  res.status(404).json({ error: "404 Not Found" });
});

// Sentry Error Handler
import * as Sentry from "@sentry/node";
Sentry.setupExpressErrorHandler(app);

app.use(errorHandlerMiddleware);

export default app;

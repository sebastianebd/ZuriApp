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

import authRoutes from "./routes/api/auth.routes";
import userRoutes from "./routes/api/users.routes";
import replacementRoutes from "./routes/api/replacement.routes";
import optionRoutes from "./routes/api/options.routes";
import auditRoutes from "./routes/api/audit.routes";
import profileRoutes from "./routes/api/profile.routes";

import "./jobs/replacement.cron"; // Import execution

// Definir token personalizado para Morgan
morgan.token("user", (req: Request) => {
  if ((req as any).user) {
    const user = (req as any).user;
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
    { stream: { write: (message: string) => logger.info(message.trim()) } }
  )
);
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

app.all("*", (req: Request, res: Response) => {
  res.status(404).json({ error: "404 Not Found" });
});

app.use(errorHandlerMiddleware);

export default app;

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const corsOptions = require("./config/cors.config");
const credentialsMiddleware = require("./middleware/credentials.middleware");
const errorHandlerMiddleware = require("./middleware/errorHandler.middleware");

// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger.config");

// Logging
const morgan = require("morgan");
const logger = require("./config/logger.config");

// Definir token personalizado para Morgan
morgan.token("user", (req) => {
  if (req.user) {
    const name = `${req.user.nombre} ${req.user.apellido}`;
    return `[User: ${name}]`;
  }
  return "[Anon]";
});

const app = express();

app.use(credentialsMiddleware);
app.use(cors(corsOptions));
// Usar formato combinado + usuario
app.use(
  morgan(
    ":remote-addr :user :method :url :status :res[content-length] - :response-time ms",
    { stream: { write: (message) => logger.info(message.trim()) } }
  )
);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Documentación API
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

const authRoutes = require("./routes/api/auth.routes");
const userRoutes = require("./routes/api/users.routes");
const replacementRoutes = require("./routes/api/replacement.routes");
const optionRoutes = require("./routes/api/options.routes");
const auditRoutes = require("./routes/api/audit.routes");
const profileRoutes = require("./routes/api/profile.routes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reemplazos", replacementRoutes);
app.use("/api/options", optionRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/profile", profileRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ error: "404 Not Found" });
});

app.use(errorHandlerMiddleware);

require("./jobs/replacement.cron");

module.exports = app;

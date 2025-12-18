const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const corsOptions = require("./config/cors.config");
const credentialsMiddleware = require("./middleware/credentials.middleware");
const errorHandlerMiddleware = require("./middleware/errorHandler.middleware");

const app = express();

app.use(credentialsMiddleware);
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

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

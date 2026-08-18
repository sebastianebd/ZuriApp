import "./config/instrument.config";
import dotenv from "dotenv";
import path from "path";
import { setupEmailWorker } from "./queues/email.queue";

// Cargar .env explícitamente desde la raíz para soportar la estructura de monorepo.
// Esto garantiza variables de entorno consistentes sin importar desde dónde se invoca el script.
dotenv.config({ path: path.resolve(__dirname, "../.env") });
// Fallback: búsqueda estándar para conveniencia en desarrollo local si falta el .env raíz.
dotenv.config();

import mongoose from "mongoose";
import connectDB from "./config/db.config";
import app from "./app";
import http from "http";
import socketIO from "./config/socket";
import logger from "./config/logger.config";

const PORT = process.env.PORT || 3500;

const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) =>
      url.trim().replace(/\/$/, ""),
    )
  : ["http://localhost:5173", "http://localhost:4173", "http://localhost:5174"];

socketIO.init(server, allowedOrigins);

// Inicializar Workers
setupEmailWorker();

connectDB();

// Solo iniciar el servidor HTTP una vez que la conexión a la Base de Datos esté establecida
// para asegurar que la aplicación esté completamente lista para manejar solicitudes de negocio.
mongoose.connection.once("open", () => {
  logger.info(`✅ Conectado a DB: ${mongoose.connection.name}`);
  server.listen(PORT, () =>
    logger.info(`✅ Server corriendo en puerto: ${PORT}`),
  );
});

// Manejadores de errores globales:
// Registramos estos errores críticos pero decidimos NO cerrar el proceso inmediatamente aquí
// para confiar en el gestor de procesos (ej: PM2, Docker) para manejar la política de reinicios si es necesario.
process.on("unhandledRejection", (reason, promise) => {
  logger.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("❌ Uncaught Exception:", error);
});

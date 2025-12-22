import dotenv from "dotenv";
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
  ? process.env.CLIENT_URL.split(",")
  : ["http://localhost:5173", "http://localhost:4173", "http://localhost:5174"];
socketIO.init(server, allowedOrigins);

connectDB();

mongoose.connection.once("open", () => {
  logger.info(`DB connected: ${mongoose.connection.name}`);
  server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
});

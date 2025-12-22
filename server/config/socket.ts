import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import logger from "./logger.config";

let ioInstance: Server | undefined;

const init = (httpServer: HttpServer, clientUrl: string | string[]): Server => {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  ioInstance.on("connection", (socket: Socket) => {
    logger.info(`🟢 Cliente conectado: ${socket.id}`);

    socket.on("disconnect", () => {
      logger.info(`🔴 Cliente desconectado: ${socket.id}`);
    });
  });

  return ioInstance;
};

const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error("Socket.io no está inicializado. Llama a init() primero.");
  }
  return ioInstance;
};

export default { init, getIO };

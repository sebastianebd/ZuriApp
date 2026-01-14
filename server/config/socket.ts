import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import logger from "./logger.config";
import redis from "./redis.config"; // Import Redis

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

  ioInstance.on("connection", async (socket: Socket) => {
    logger.info(`🟢 Cliente conectado: ${socket.id}`);
    logger.info(`🔍 Handshake Auth: ${JSON.stringify(socket.handshake.auth)}`);
    logger.info(
      `🔍 Handshake Query: ${JSON.stringify(socket.handshake.query)}`
    );

    // Retrieve User ID from Auth (assuming middleware or handshake query)
    // Note: Standard JWT middlewares usually attach user to socket.
    // For now, we will assume the client sends userId in handshake.auth or query
    // Adjust this match your actual client-side socket connection logic.
    const userId =
      (socket.handshake.auth && socket.handshake.auth.userId) ||
      (socket.handshake.query && socket.handshake.query.userId);

    if (userId) {
      const metadata = {
        socket_id: socket.id,
        ip: socket.handshake.address,
        device: socket.handshake.headers["user-agent"] || "Unknown",
        connected_at: new Date().toISOString(),
      };

      try {
        await redis.set(
          `active_session:${userId}`,
          JSON.stringify(metadata),
          "EX",
          86400
        ); // 1 day TTL
        logger.info(`🔐 Sesión registrada en Redis para usuario: ${userId}`);
      } catch (err) {
        logger.error(`❌ Error guardando sesión en Redis: ${err}`);
      }
    }

    socket.on("disconnect", async () => {
      logger.info(`🔴 Cliente desconectado: ${socket.id}`);
      if (userId) {
        try {
          // Only delete if the stored socket_id matches this socket (avoid race conditions)
          const storedSession = await redis.get(`active_session:${userId}`);
          if (storedSession) {
            const sessionData = JSON.parse(storedSession);
            if (sessionData.socket_id === socket.id) {
              await redis.del(`active_session:${userId}`);
              logger.info(
                `🔓 Sesión eliminada de Redis para usuario: ${userId}`
              );
            }
          }
        } catch (err) {
          logger.error(`❌ Error eliminando sesión de Redis: ${err}`);
        }
      }
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

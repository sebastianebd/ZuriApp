import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import logger from "./logger.config";
import redis from "./redis.config"; // Cliente Redis compartido

let ioInstance: Server | undefined;

// Inicialización de WebSockets
// Configura Socket.IO asociado al servidor HTTP existente, compartiendo el mismo puerto.
const init = (httpServer: HttpServer, clientUrl: string | string[]): Server => {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ["GET", "POST"],
      credentials: true, // Necesario para cookies de sesión si las hubiera
    },
  });

  ioInstance.on("connection", async (socket: Socket) => {
    logger.info(`🟢 Cliente conectado: ${socket.id}`);

    // Debugging de Handshake
    // Útil para verificar qué datos envía el cliente al conectar.
    logger.info(`🔍 Handshake Auth: ${JSON.stringify(socket.handshake.auth)}`);
    logger.info(
      `🔍 Handshake Query: ${JSON.stringify(socket.handshake.query)}`,
    );

    // Identificación de Usuario
    // Extracción robusta del ID de usuario desde el handshake (auth object o query param).
    // Esto es crítico para mapear sockets a usuarios específicos en Redis.
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
        // Registro de Sesión Activa (Single Session Enforcement)
        // Guardamos la metadata de la conexión en Redis.
        // TTL de 1 día (86400s) como mecanismo de seguridad (limpieza automática).
        await redis.set(
          `active_session:${userId}`,
          JSON.stringify(metadata),
          "EX",
          86400,
        );
        logger.info(`🔐 Sesión registrada en Redis para usuario: ${userId}`);
      } catch (err) {
        // Fallor no-bloqueante: Si Redis falla, el usuario conecta pero sin control de concurrencia.
        logger.error(`❌ Error guardando sesión en Redis: ${err}`);
      }
    }

    socket.on("disconnect", async () => {
      logger.info(`🔴 Cliente desconectado: ${socket.id}`);
      if (userId) {
        try {
          // Limpieza de Sesión
          // Verificamos que la sesión en Redis corresponda al socket que se desconecta
          // para evitar cerrar la sesión de una nueva conexión concurrente válida.
          const storedSession = await redis.get(`active_session:${userId}`);
          if (storedSession) {
            const sessionData = JSON.parse(storedSession);
            if (sessionData.socket_id === socket.id) {
              await redis.del(`active_session:${userId}`);
              logger.info(
                `🔓 Sesión eliminada de Redis para usuario: ${userId}`,
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

// Singleton Accessor
// Permite obtener la instancia de IO desde controladores u otros servicios
// sin necesidad de pasarla como dependencia.
const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error("Socket.io no está inicializado. Llama a init() primero.");
  }
  return ioInstance;
};

export default { init, getIO };

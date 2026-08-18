import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import logger from "./logger.config";
import redis from "./redis.config"; // Cliente Redis compartido
import authMiddleware, { AuthRequest } from "../middleware/authentication.middleware";

let ioInstance: Server | undefined;

// Wrapper para inyectar middleware de Express en Socket.IO
// Intercepta las llamadas a res.status().json() para convertirlas en errores de conexión
const wrap = (middleware: any) => (socket: Socket, next: any) => {
  const req = socket.request as AuthRequest;
  
  // Soportar token enviado en auth.token (común en clientes Socket.IO)
  if (socket.handshake.auth && socket.handshake.auth.token) {
    req.headers.authorization = `Bearer ${socket.handshake.auth.token}`;
  }
  
  const res = {
    status: (code: number) => ({
      json: (data: any) => next(new Error(`${code}: ${data.message}`))
    })
  };
  
  middleware(req, res, next);
};

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

  // Autenticación obligatoria antes de establecer la conexión
  ioInstance.use(wrap(authMiddleware));

  ioInstance.on("connection", async (socket: Socket) => {
    logger.info(`🟢 Cliente conectado: ${socket.id}`);

    const req = socket.request as AuthRequest;
    
    // Identificación de Usuario
    // Extracción robusta del ID de cuenta desde el middleware JWT decodificado
    // Esto previene suplantación de identidad (Spoofing) y separa dominios
    const accountId = req.account?.id;

    if (accountId) {
      const metadata = {
        socket_id: socket.id,
        ip: socket.handshake.address,
        device: socket.handshake.headers["user-agent"] || "Unknown",
        connected_at: new Date().toISOString(),
      };

      try {
        // Registro de Sesión Activa (Single Session Enforcement)
        // Guardamos la metadata de la conexión en Redis asociado al accountId.
        // TTL de 1 día (86400s) como mecanismo de seguridad (limpieza automática).
        await redis.set(
          `active_session:${accountId}`,
          JSON.stringify(metadata),
          "EX",
          86400,
        );
        logger.info(`🔐 Sesión registrada en Redis para account: ${accountId}`);
      } catch (err) {
        // Fallo no-bloqueante: Si Redis falla, el usuario conecta pero sin control de concurrencia.
        logger.error(`❌ Error guardando sesión en Redis: ${err}`);
      }
    }

    socket.on("disconnect", async () => {
      logger.info(`🔴 Cliente desconectado: ${socket.id}`);
      if (accountId) {
        try {
          // Limpieza de Sesión
          // Verificamos que la sesión en Redis corresponda al socket que se desconecta
          // para evitar cerrar la sesión de una nueva conexión concurrente válida.
          const storedSession = await redis.get(`active_session:${accountId}`);
          if (storedSession) {
            const sessionData = JSON.parse(storedSession);
            if (sessionData.socket_id === socket.id) {
              await redis.del(`active_session:${accountId}`);
              logger.info(
                `🔓 Sesión eliminada de Redis para account: ${accountId}`,
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

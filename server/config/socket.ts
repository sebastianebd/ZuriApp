import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import logger from "./logger.config";
import redis from "./redis.config"; // Cliente Redis compartido
import Account from "../models/account.model";
import Staff from "../models/staff.model";
import Service from "../models/service.model";
import { PORTAL_JWT_SECRET } from "../services/pwa-auth.service";

let ioInstance: Server | undefined;

function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const name = parts[0]?.trim();
    if (name) {
      list[name] = parts.slice(1).join("=").trim();
    }
  });
  return list;
}

/**
 * Middleware de Autenticación Híbrida para Socket.IO.
 * Soporta credenciales de:
 * 1. Cuentas de Escritorio / Jefatura (JWT firmado con ACCESS_TOKEN_SECRET en auth.token o Authorization header).
 * 2. Funcionarios PWA / Honorarios (JWT firmado con PORTAL_JWT_SECRET en cookie zuriapp_pwa_session o auth.pwaToken).
 */
export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const auth = socket.handshake.auth || {};
    const headers = socket.handshake.headers || {};
    const cookies = parseCookies(headers.cookie);

    let bearerToken =
      auth.token ||
      (headers.authorization?.startsWith("Bearer ")
        ? headers.authorization.split(" ")[1]
        : undefined);

    let pwaToken = auth.pwaToken || cookies.zuriapp_pwa_session;

    const req = socket.request as any;

    // Intento 1: Validar como Account (Sistema Web Desktop)
    if (bearerToken) {
      try {
        const decoded = jwt.verify(
          bearerToken,
          process.env.ACCESS_TOKEN_SECRET as string
        ) as jwt.JwtPayload;

        if (decoded?.id) {
          const account = await Account.findById(decoded.id);
          if (account && account.isActive) {
            let staff: any = null;
            if (account.staffId) {
              const staffQuery = Staff.findById(account.staffId);
              staff = typeof (staffQuery as any)?.populate === "function"
                ? await (staffQuery as any).populate("roleId")
                : await staffQuery;
              if (staff && staff.isDeleted) {
                return next(new Error("401: Cuenta inactiva o eliminada"));
              }
            }
            const staffName = staff
              ? `${staff.firstName || ''} ${staff.lastName || ''}`.trim()
              : account.rut;

            req.account = {
              id: account._id.toString(),
              rut: account.rut,
              name: staffName,
            };
            if (staff) {
              req.staff = staff;
            }
            return next();
          }
        }
      } catch {
        // Si no validó como desktop token, intentamos si era un token de portal
        if (!pwaToken) {
          pwaToken = bearerToken;
        }
      }
    }

    // Intento 2: Validar como Funcionario PWA (Cookie zuriapp_pwa_session o pwaToken)
    if (pwaToken) {
      try {
        const decoded = jwt.verify(
          pwaToken,
          PORTAL_JWT_SECRET
        ) as jwt.JwtPayload;

        if (decoded?.staffId) {
          const staff = await Staff.findById(decoded.staffId);
          if (staff && staff.isActive && !staff.isDeleted) {
            req.staff = staff;
            req.isPortalUser = true;
            return next();
          }
        }
      } catch (pwaErr) {
        logger.warn(`[SocketAuth] Falló validación de token PWA: ${pwaErr}`);
      }
    }

    logger.warn(`[SocketAuth] Rechazada conexión socket ${socket.id}: No autenticado`);
    return next(new Error("401: Acceso no autorizado: se requiere token o sesión válida"));
  } catch (error: any) {
    logger.error(`[SocketAuth] Error inesperado en handshake: ${error}`);
    return next(new Error("500: Error interno de autenticación"));
  }
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
      credentials: true, // Necesario para cookies de sesión
    },
  });

  // Autenticación obligatoria (Desktop y PWA)
  ioInstance.use(socketAuthMiddleware);

  ioInstance.on("connection", async (socket: Socket) => {
    logger.info(`🟢 Cliente conectado: ${socket.id}`);

    const req = socket.request as any;
    const accountId = req.account?.id;
    const staff = req.staff;

    const isAdmin =
      staff?.roleId?.level === 100 ||
      staff?.roleId?.code === "ADMIN" ||
      (req.account as any)?.level === 100;

    if (isAdmin) {
      socket.join("hospital:all");
      logger.info(`📡 Socket ${socket.id} (Admin) unido a sala hospital:all`);
    }

    // Auto-unir a la sala de su servicio hospitalario si está asignado
    const serviceId = staff?.serviceId?._id?.toString() || staff?.serviceId?.toString();
    if (serviceId) {
      socket.join(`service:${serviceId}`);
      logger.info(`📡 Socket ${socket.id} auto-unido a sala service:${serviceId}`);
    }

    // Auto-unir a las salas de servicios donde ejerce rol de liderazgo (Jefe, Supervisor, Coordinador, Jefe de Turno)
    if (staff?._id) {
      try {
        const assignedServices = await Service.find({
          $or: [
            { jefe_servicio: staff._id },
            { supervisor: staff._id },
            { coordinadores: staff._id },
            { jefes_turno: staff._id },
          ],
          deleted_at: null,
          activo: true,
        }).select("_id");

        assignedServices.forEach((s: any) => {
          const sId = s._id.toString();
          socket.join(`service:${sId}`);
          logger.info(`📡 Socket ${socket.id} auto-unido a sala de jefatura service:${sId}`);
        });
      } catch (err) {
        logger.warn(`[Socket] Error auto-uniendo a servicios de jefatura: ${err}`);
      }
    }

    if (accountId) {
      const metadata = {
        socket_id: socket.id,
        ip: socket.handshake.address,
        device: socket.handshake.headers["user-agent"] || "Unknown",
        connected_at: new Date().toISOString(),
      };

      try {
        // Registro de Sesión Activa (Single Session Enforcement)
        await redis.set(
          `active_session:${accountId}`,
          JSON.stringify(metadata),
          "EX",
          86400,
        );
        logger.info(`🔐 Sesión registrada en Redis para account: ${accountId}`);
      } catch (err) {
        logger.error(`❌ Error guardando sesión en Redis: ${err}`);
      }
    }

    socket.on("join:service", (srvId: string) => {
      if (srvId) {
        socket.join(`service:${srvId}`);
        logger.info(`📡 Socket ${socket.id} unido a sala service:${srvId}`);
      }
    });

    socket.on("leave:service", (srvId: string) => {
      if (srvId) {
        socket.leave(`service:${srvId}`);
        logger.info(`📡 Socket ${socket.id} salió de sala service:${srvId}`);
      }
    });

    socket.on("disconnect", async () => {
      logger.info(`🔴 Cliente desconectado: ${socket.id}`);
      if (accountId) {
        try {
          const storedSession = await redis.get(`active_session:${accountId}`);
          if (storedSession) {
            const sessionData = JSON.parse(storedSession);
            if (sessionData.socket_id === socket.id) {
              await redis.del(`active_session:${accountId}`);
              logger.info(`🔓 Sesión eliminada de Redis para account: ${accountId}`);
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
const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error("Socket.io no está inicializado. Llama a init() primero.");
  }
  return ioInstance;
};

export default { init, getIO };

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";
import Cargo from "../models/cargo.model";

export class AuthError extends Error {
  status: number;
  constructor(message: string = "Rut o contraseña incorrecta") {
    super(message);
    this.name = "AuthError";
    this.status = 401;
  }
}

export class ValidationError extends Error {
  status: number;
  constructor(message: string = "Campos inválidos") {
    super(message);
    this.name = "ValidationError";
    this.status = 422;
  }
}

const generateAccessToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: "1800s",
  });
};

const generateRefreshToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: "1d",
  });
};

// Import Dependencies for Concurrent Login Check
import socketConfig from "../config/socket";
import redis from "../config/redis.config";

import LoginHistory from "../models/login-history.model";

async function login({
  rut,
  password,
  ip,
  userAgent,
}: {
  rut?: string;
  password?: string;
  ip?: string;
  userAgent?: string;
}) {
  if (!rut || !password) {
    throw new ValidationError("Campos de autenticación requeridos.");
  }

  const user = await User.findOne({ rut }).select("+password").exec();

  if (!user) {
    // Audit Log Failure:
    // Logueamos intento fallido registrando "Usuario no encontrado" pero sin dar feedback específico
    // al frontend para evitar enumeración de usuarios.
    console.warn(`[Login Failed] User not found for rut: ${rut}`);
    throw new AuthError("Rut o contraseña incorrecta.");
  }

  const match = await bcrypt.compare(password, user.password as string);
  if (!match) {
    // Seguridad: Registro de Fallo
    await LoginHistory.create({
      user: user._id,
      ip: ip || "Unknown",
      userAgent: userAgent || "Unknown",
      status: "FAILED",
    });
    // Decisión de Diseño: Solo registramos historial para usuarios existentes para evitar
    // llenar la BD con spam de intentos a RUTs aleatorios.
    console.warn(`[Login Failed] Password mismatch for user: ${rut}`);
    throw new AuthError("Rut o contraseña incorrecta.");
  }

  // --- SINGLE SESSION ENFORCEMENT ---
  // Política de Seguridad: Evitar logins concurrentes.
  // Verificamos si existe una sesión activa en Redis antes de otorgar un nuevo token.
  // Flag Feature: Permitimos deshabilitar esto en CI/Test para facilitar pruebas paralelas.
  if (process.env.DISABLE_CONCURRENT_SESSION !== "true") {
    const activeSession = await redis.get(`active_session:${user._id}`);

    if (activeSession) {
      const sessionData = JSON.parse(activeSession);
      const io = socketConfig.getIO();

      // Verificación de Conectividad Real:
      // No basta con que este en Redis, verificamos si el Socket sigue vivo en el servidor.
      const connectedSockets = io.sockets.sockets; // Map<string, Socket>
      if (connectedSockets.has(sessionData.socket_id)) {
        // Usuario conectado activamente -> Rechazar Login.
        // Retornamos 409 Conflict para que el frontend pueda mostrar un mensaje específico ("Cuenta en uso").
        console.warn(
          `[Security] Login bloqueado para usuario ${user.rut}. Ya tiene sesión activa en ${sessionData.device}`,
        );

        const error = new Error("Cuenta conectada");
        (error as any).status = 409;
        throw error;
      } else {
        // Sesión Stale:
        // El registro existía en Redis pero el socket ya no está.
        // (Ej: Reinicio de servidor o desconexión no limpia). Limpiamos y permitimos proceder.
        console.log(`[Info] Limpiando sesión stale para usuario ${user.rut}`);
        await redis.del(`active_session:${user._id}`);
      }
    }
  }
  // -----------------------------

  // Audit Log Success
  await LoginHistory.create({
    user: user._id,
    ip: ip || "Unknown",
    userAgent: userAgent || "Unknown",
    status: "SUCCESS",
  });

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Seguridad Token:
  // Almacenamos el refresh token hasheado en la base de datos (como si fuera una password)
  // para prevenir robo de sesiones en caso de dump de base de datos.
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  user.refresh_token = hashedRefreshToken;
  await user.save();

  // Resolución de Permisos:
  // Buscamos el cargo ya sea por nombre (Regex case-insensitive) o código exacto.
  const cargo = await Cargo.findOne({
    $or: [
      { nombre: { $regex: new RegExp(`^${user.tipo_cargo}$`, "i") } },
      { codigo: user.tipo_cargo.toUpperCase() },
    ],
  }).lean();

  // Construcción de Payload:
  // Inyectamos niveles y permisos calculados al objeto usuario para uso inmediato en frontend.
  const userPayload = {
    ...user.toObject(),
    nivel: cargo?.nivel || 10,
    permisos: cargo?.permisos || [],
  };

  return { accessToken, refreshToken, user: userPayload };
}

async function getLoginHistory(userId: string) {
  return await LoginHistory.find({ user: userId })
    .sort({ timestamp: -1 })
    .limit(20)
    .exec();
}

async function logout(refreshToken: string) {
  if (!refreshToken) return;

  let decoded: any;
  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        ignoreExpiration: true,
      },
    );
  } catch (error) {
    return;
  }

  const userId = decoded?.id;
  if (!userId) return;

  const user = await User.findById(userId).select("+refresh_token").exec();
  if (!user || !user.refresh_token) return;

  const match = await bcrypt.compare(refreshToken, user.refresh_token);

  if (!match) return;

  // Revocación de Sesión:
  // Al hacer logout, limpiamos el refresh token de la BD, invalidando efectivamente la sesión persistente.
  user.refresh_token = undefined;
  await user.save();
}

async function refresh(refreshToken: string) {
  if (!refreshToken) {
    throw new AuthError("Token de actualización no encontrado.");
  }

  let decoded: any;
  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
    );
  } catch (error) {
    throw new AuthError("Token de actualización inválido o expirado.");
  }

  const userId = decoded?.id;
  if (!userId) {
    throw new AuthError("Token de actualización inválido.");
  }

  const user = await User.findById(userId).select("+refresh_token").exec();
  if (!user || !user.refresh_token) {
    throw new AuthError("Sesión no válida o usuario no encontrado.");
  }

  // Rotación/Verificación:
  // Validamos contra el hash en BD. Esto permite invalidar tokens remotamente simplemente cambiando el hash en BD.
  const match = await bcrypt.compare(refreshToken, user.refresh_token);
  if (!match) {
    throw new AuthError(
      "Token de actualización no coincide. Re-autenticación requerida.",
    );
  }

  const accessToken = generateAccessToken(user.id);

  return accessToken;
}

async function changePassword(
  userId: string,
  current: string,
  newPass: string,
) {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new AuthError("Usuario no encontrado");
  }

  const match = await bcrypt.compare(current, user.password as string);
  if (!match) {
    throw new AuthError("La contraseña actual es incorrecta");
  }

  user.password = newPass;

  await user.save();
}

export default { login, logout, refresh, changePassword, getLoginHistory };

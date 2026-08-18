import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Account, { IAccount } from "../models/account.model";
import Staff from "../models/staff.model";
import { AppError } from "../errors/app-error";
import socketConfig from "../config/socket";
import redis from "../config/redis.config";
import LoginHistory from "../models/login-history.model";
import logger from "../config/logger.config";
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

const generateAccessToken = (accountId: string) => {
  return jwt.sign({ id: accountId }, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: "1800s",
  });
};

const generateRefreshToken = (accountId: string) => {
  return jwt.sign({ id: accountId }, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: "1d",
  });
};

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

  const account = await Account.findOne({ rut }).select("+password").exec();

  if (!account) {
    // Audit Log Failure:
    // Logueamos intento fallido registrando "Usuario no encontrado" pero sin dar feedback específico
    // al frontend para evitar enumeración de usuarios.
    logger.warn(`[Login Failed] User not found for rut: ${rut}`);
    throw new AuthError("Rut o contraseña incorrecta.");
  }

  const match = await bcrypt.compare(password, account.password as string);
  if (!match) {
    // Seguridad: Registro de Fallo
    await LoginHistory.create({
      accountId: account._id,
      ip: ip || "Unknown",
      userAgent: userAgent || "Unknown",
      status: "FAILED",
    });
    // Decisión de Diseño: Solo registramos historial para usuarios existentes para evitar
    // llenar la BD con spam de intentos a RUTs aleatorios.
    logger.warn(`[Login Failed] Password mismatch for rut: ${rut}`);
    throw new AuthError("Rut o contraseña incorrecta.");
  }

  // --- SINGLE SESSION ENFORCEMENT ---
  // Política de Seguridad: Evitar logins concurrentes.
  // Verificamos si existe una sesión activa en Redis antes de otorgar un nuevo token.
  // Flag Feature: Permitimos deshabilitar esto en CI/Test para facilitar pruebas paralelas.
  if (process.env.DISABLE_CONCURRENT_SESSION !== "true") {
    const activeSession = await redis.get(`active_session:${account.staffId}`);

    if (activeSession) {
      const sessionData = JSON.parse(activeSession);
      const io = socketConfig.getIO();

      // Verificación de Conectividad Real:
      // No basta con que este en Redis, verificamos si el Socket sigue vivo en el servidor.
      const connectedSockets = io.sockets.sockets; // Map<string, Socket>
      if (connectedSockets.has(sessionData.socket_id)) {
        // Usuario conectado activamente -> Rechazar Login.
        // Retornamos 409 Conflict para que el frontend pueda mostrar un mensaje específico ("Cuenta en uso").
        logger.warn(
          `[Security] Login bloqueado para rut ${account.rut}. Ya tiene sesión activa en ${sessionData.device}`,
        );

        const error = new Error("Cuenta conectada");
        (error as any).status = 409;
        throw error;
      } else {
        // Sesión Stale:
        // El registro existía en Redis pero el socket ya no está.
        // (Ej: Reinicio de servidor o desconexión no limpia). Limpiamos y permitimos proceder.
        logger.info(`Limpiando sesión stale para rut ${account.rut}`);
        await redis.del(`active_session:${account.staffId}`);
      }
    }
  }
  // -----------------------------

  // Audit Log Success
  await LoginHistory.create({
    accountId: account._id,
    ip: ip || "Unknown",
    userAgent: userAgent || "Unknown",
    status: "SUCCESS",
  });

  const accessToken = generateAccessToken(account._id.toString());
  const refreshToken = generateRefreshToken(account._id.toString());

  // Seguridad Token:
  // Almacenamos el refresh token hasheado en la base de datos (como si fuera una password)
  // para prevenir robo de sesiones en caso de dump de base de datos.
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  account.refresh_token = hashedRefreshToken;
  await account.save();

  // Resolución de Permisos:
  const staff = await Staff.findById(account.staffId).populate(["roleId", "positionId"]).exec();

  if (!staff) {
    throw new AuthError("Personal asociado a la cuenta no encontrado.");
  }

  // Construcción del Payload de Staff con permisos del Rol
  const staffObj = staff.toObject();
  const roleDoc = staffObj.roleId as any;
  const { roleId, ...restStaff } = staffObj;
  
  const staffPayload = {
    ...restStaff,
    role: {
      code: roleDoc?.code,
      level: roleDoc?.level || 0,
      permissions: roleDoc?.permissions || [],
      hasSystemAccess: roleDoc?.hasSystemAccess || false
    }
  };

  return { 
    accessToken, 
    refreshToken, 
    account: { id: account._id, name: account.rut }, 
    staff: staffPayload 
  };
}

async function getLoginHistory(accountId: string) {
  return await LoginHistory.find({ accountId })
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

  const accountId = decoded?.id;
  if (!accountId) return;

  const account = await Account.findById(accountId).select("+refresh_token").exec();
  if (!account || !account.refresh_token) return;

  const match = await bcrypt.compare(refreshToken, account.refresh_token);

  if (!match) return;

  // Revocación de Sesión:
  // Al hacer logout, limpiamos el refresh token de la BD, invalidando efectivamente la sesión persistente.
  account.refresh_token = undefined;
  await account.save();
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

  const accountId = decoded?.id;
  if (!accountId) {
    throw new AuthError("Token de actualización inválido.");
  }

  const account = await Account.findById(accountId).select("+refresh_token").exec();
  if (!account || !account.refresh_token) {
    throw new AuthError("Sesión no válida o usuario no encontrado.");
  }

  // Rotación/Verificación:
  // Validamos contra el hash en BD. Esto permite invalidar tokens remotamente simplemente cambiando el hash en BD.
  const match = await bcrypt.compare(refreshToken, account.refresh_token);
  if (!match) {
    throw new AuthError(
      "Token de actualización no coincide. Re-autenticación requerida.",
    );
  }

  const accessToken = generateAccessToken(account._id.toString());

  return accessToken;
}

async function changePassword(
  accountId: string,
  current: string,
  newPass: string,
) {
  const account = await Account.findById(accountId).select("+password");
  if (!account) {
    throw new AuthError("Usuario no encontrado");
  }

  const match = await bcrypt.compare(current, account.password as string);
  if (!match) {
    throw new AuthError("La contraseña actual es incorrecta");
  }

  account.password = newPass;

  await account.save();
}

/**
 * Genera un token de un solo uso (One-Time Link) para activación o reseteo de contraseña.
 * - rawToken: se envía en la URL del correo.
 * - hashedToken: solo este se guarda en la BD (protección ante brechas).
 */
export async function generateResetToken(accountId: string): Promise<{ rawToken: string }> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  await Account.findByIdAndUpdate(accountId, {
    $set: {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return { rawToken };
}

/**
 * Valida un One-Time Link: hashea el token recibido de la URL y lo busca en la BD.
 * Solo es válido si existe y no ha expirado. El token se invalida al cambiar la clave (no al abrirlo).
 */
export async function validateResetToken(rawToken: string): Promise<IAccount> {
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  const account = await Account.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: new Date() },
  });

  if (!account) {
    throw new AppError(400, "El enlace de restablecimiento es inválido o ha expirado");
  }

  return account;
}

export default { login, logout, refresh, changePassword, getLoginHistory };


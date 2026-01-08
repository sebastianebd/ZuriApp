import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";

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

// Import dependencies for Concurrent Login Check
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
    // Log Failed Attempt (Unknown User or Wrong User)
    console.warn(`[Login Failed] User not found for rut: ${rut}`);
    throw new AuthError("Rut o contraseña incorrecta.");
  }

  const match = await bcrypt.compare(password, user.password as string);
  if (!match) {
    // Log Failed Attempt
    await LoginHistory.create({
      user: user._id,
      ip: ip || "Unknown",
      userAgent: userAgent || "Unknown",
      status: "FAILED",
    });
    // Ideally we'd log against the attempted RUT but that's PII without a user link.
    // Decision: Only log history for found users to avoid clutter/DOS.
    console.warn(`[Login Failed] Password mismatch for user: ${rut}`);
    throw new AuthError("Rut o contraseña incorrecta.");
  }

  // --- CONCURRENT LOGIN CHECK ---
  // Check if user has an active session in Redis (Only if password matches)
  const activeSession = await redis.get(`active_session:${user._id}`);

  if (activeSession) {
    const sessionData = JSON.parse(activeSession);
    const io = socketConfig.getIO();

    // Verify if socket is truly connected
    const connectedSockets = io.sockets.sockets; // Map<string, Socket>
    if (connectedSockets.has(sessionData.socket_id)) {
      // User is connected! Reject login.
      // We log the attempt but do NOT return details to client (Security)
      console.warn(
        `[Security] Login bloqueado para usuario ${user.rut}. Ya tiene sesión activa en ${sessionData.device}`
      );

      // Return 409 Conflict
      const error = new Error("Cuenta conectada");
      (error as any).status = 409;
      throw error;
    } else {
      // Socket ID in Redis but not in IO -> Stale session (e.g. server restart or crash)
      // Allow login and it will be overwritten when client connects socket.
      console.log(`[Info] Limpiando sesión stale para usuario ${user.rut}`);
      await redis.del(`active_session:${user._id}`);
    }
  }
  // -----------------------------

  // Log Success Attempt
  await LoginHistory.create({
    user: user._id,
    ip: ip || "Unknown",
    userAgent: userAgent || "Unknown",
    status: "SUCCESS",
  });

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  user.refresh_token = hashedRefreshToken;
  await user.save();

  return { accessToken, refreshToken, user };
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
      }
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

  user.refresh_token = undefined; // Mongoose unset behavior? Or null?
  // Schema defines type String. null is fine.
  // Interface defines optional string.
  // Setting undefined usually skips it in update?
  // But strictly removing it:
  user.refresh_token = undefined;
  // Wait, if I want to remove it from DB, explicitly set to undefined/null works if Schema allows.
  // Better use $unset logic or just string | undefined in interface.
  // user.refresh_token = null as any; // forceful
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
      process.env.REFRESH_TOKEN_SECRET as string
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

  const match = await bcrypt.compare(refreshToken, user.refresh_token);
  if (!match) {
    throw new AuthError(
      "Token de actualización no coincide. Re-autenticación requerida."
    );
  }

  const accessToken = generateAccessToken(user.id);

  return accessToken;
}

async function changePassword(
  userId: string,
  current: string,
  newPass: string
) {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new AuthError("Usuario no encontrado");
  }

  const match = await bcrypt.compare(current, user.password as string);
  if (!match) {
    throw new AuthError("La contraseña actual es incorrecta");
  }

  // Passwords will be hashed by the pre-save hook in the User model
  user.password = newPass;

  // DEBUG: Log the new password explicitly requested by user for confirmation
  console.log(
    `[DEBUG] Contraseña actualizada para usuario ${user.rut}: ${newPass}`
  );

  await user.save();
}

export default { login, logout, refresh, changePassword, getLoginHistory };

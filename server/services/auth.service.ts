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

async function login({ rut, password }: { rut?: string; password?: string }) {
  if (!rut || !password) {
    throw new ValidationError("Campos de autenticación requeridos.");
  }

  const user = await User.findOne({ rut }).select("+password").exec();

  if (!user) {
    throw new AuthError("Rut o contraseña incorrecta.");
  }

  const match = await bcrypt.compare(password, user.password as string);
  if (!match) {
    throw new AuthError("Rut o contraseña incorrecta.");
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  user.refresh_token = hashedRefreshToken;
  await user.save();

  return { accessToken, refreshToken, user };
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

export default { login, logout, refresh };

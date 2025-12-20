const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

class AuthError extends Error {
  constructor(message = "Rut o contraseña incorrecta") {
    super(message);
    this.name = "AuthError";
    this.status = 401;
  }
}

class ValidationError extends Error {
  constructor(message = "Campos inválidos") {
    super(message);
    this.name = "ValidationError";
    this.status = 422;
  }
}

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1800s",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "1d",
  });
};

async function login({ rut, password }) {
  if (!rut || !password) {
    throw new ValidationError("Campos de autenticación requeridos.");
  }

  const user = await User.findOne({ rut }).select("+password").exec();

  if (!user) {
    throw new AuthError("Rut o contraseña incorrecta.");
  }

  const match = await bcrypt.compare(password, user.password);
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

async function logout(refreshToken) {
  if (!refreshToken) return;

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, {
      ignoreExpiration: true,
    });
  } catch (error) {
    return;
  }

  const userId = decoded?.id;
  if (!userId) return;

  const user = await User.findById(userId).select("+refresh_token").exec();
  if (!user || !user.refresh_token) return;

  const match = await bcrypt.compare(refreshToken, user.refresh_token);

  if (!match) return;

  user.refresh_token = null;
  await user.save();
}

// ---

async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new AuthError("Token de actualización no encontrado.");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
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

module.exports = { login, logout, refresh };

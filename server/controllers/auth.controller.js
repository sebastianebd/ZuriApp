const authService = require("../services/auth.service");
const logger = require("../config/logger.config");

async function login(req, res) {
  try {
    const { accessToken, refreshToken, user } = await authService.login(
      req.body
    );
    res
      .cookie("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      })
      .json({ access_token: accessToken, user });

    logger.info(
      `✅ Login exitoso: ${user.rut} ${user.nombre} ${user.apellido}`
    );
  } catch (error) {
    res.status(error.status || 500).json({ mensaje: error.message });
  }
}

async function logout(req, res) {
  try {
    await authService.logout(req.cookies.refresh_token);
    res.clearCookie("refresh_token", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      secure: process.env.NODE_ENV === "production",
    });

    if (req.user) {
      logger.info(
        `👋 Logout realizado: User ${req.user.rut} ${req.user.nombre} ${req.user.apellido}`
      );
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(error.status || 500).json({ mensaje: error.message });
  }
}

async function refresh(req, res) {
  try {
    const token = await authService.refresh(req.cookies.refresh_token);
    res.json({ access_token: token });
  } catch (error) {
    res.status(error.status || 401).json({ mensaje: error.message });
  }
}

async function user(req, res) {
  res.status(200).json(req.user);
}

module.exports = { login, logout, refresh, user };

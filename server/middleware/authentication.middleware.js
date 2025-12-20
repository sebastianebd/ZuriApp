// middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const logger = require("../config/logger.config");
const User = require("../models/user.model");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Acceso no autorizado: se requiere token",
      });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Token inválido o expirado",
        });
      }

      const user = await User.findById(decoded.id)
        .select("-password -refresh_token")
        .exec();

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      req.user = user.toObject({ getters: true });
      next();
    });
  } catch (error) {
    console.error("❌ Error en authMiddleware:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno de autenticación",
    });
  }
}

module.exports = authMiddleware;

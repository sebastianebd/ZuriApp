import { Request, Response } from "express";
import authService from "../services/auth.service";
import logger from "../config/logger.config";
import { AuthRequest } from "../middleware/authentication.middleware";

async function login(req: Request, res: Response) {
  try {
    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "Unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";

    const { accessToken, refreshToken, user } = await authService.login({
      ...req.body,
      ip,
      userAgent,
    });
    res
      .cookie("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Lowercase for type safety (option "strict" | "lax" | "none")
        secure: process.env.NODE_ENV === "production",
      })
      .json({ access_token: accessToken, user });

    logger.info(
      `✅ Login exitoso: ${user.rut} ${user.nombre} ${user.apellido}`
    );
  } catch (error: any) {
    res.status(error.status || 500).json({ mensaje: error.message });
  }
}

async function logout(req: AuthRequest, res: Response) {
  try {
    await authService.logout(req.cookies.refresh_token);
    res.clearCookie("refresh_token", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    if (req.user) {
      logger.info(
        `👋 Logout realizado: User ${req.user.rut} ${req.user.nombre} ${req.user.apellido}`
      );
    }
    res.sendStatus(204);
  } catch (error: any) {
    res.status(error.status || 500).json({ mensaje: error.message });
  }
}

async function refresh(req: Request, res: Response) {
  try {
    const token = await authService.refresh(req.cookies.refresh_token);
    res.json({ access_token: token });
  } catch (error: any) {
    res.status(error.status || 401).json({ mensaje: error.message });
  }
}

async function user(req: AuthRequest, res: Response) {
  res.status(200).json(req.user);
}

async function changePassword(req: AuthRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    // Assuming authMiddleware populates req.user
    if (!req.user) {
      return res.status(401).json({ mensaje: "Usuario no autenticado" });
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    logger.info(
      `🔐 Contraseña cambiada exitosamente para usuario ${req.user.id}`
    );
    res.status(200).json({ mensaje: "Contraseña actualizada exitosamente" });
  } catch (error: any) {
    res.status(error.status || 500).json({ mensaje: error.message });
  }
}

export default { login, logout, refresh, user, changePassword, getHistory };

async function getHistory(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ mensaje: "Usuario no autenticado" });
    }
    const history = await authService.getLoginHistory(req.user.id);
    res.status(200).json(history);
  } catch (error: any) {
    res.status(500).json({ mensaje: error.message });
  }
}

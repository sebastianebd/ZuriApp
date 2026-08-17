import { Request, Response } from "express";
import authService from "../services/auth.service";
import logger from "../config/logger.config";
import { AuthRequest } from "../middleware/authentication.middleware";
async function login(req: Request, res: Response) {
  try {
    // Captura de metadatos de conexión para auditoría de seguridad
    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "Unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";

    const { accessToken, refreshToken, account, staff } = await authService.login({
      ...req.body,
      ip,
      userAgent,
    });
    res
      .cookie("refresh_token", refreshToken, {
        httpOnly: true, // Prevención XSS: Cookie inaccesible desde JS del cliente
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'None' necesario para Cross-Site en Prod (si front y back están en dominios distintos)
        secure: process.env.NODE_ENV === "production", // Solo HTTPS en Prod
      })
      .json({ access_token: accessToken, account, staff });

    logger.info(
      `✅ Login exitoso: ${account.name} ${staff.firstName} ${staff.lastName}`,
    );
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error en login" });
  }
}

async function logout(req: AuthRequest, res: Response) {
  try {
    await authService.logout(req.cookies.refresh_token);
    // Limpieza de cookie segura
    res.clearCookie("refresh_token", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    if (req.staff) {
      logger.info(
        `👋 Logout realizado: User ${req.account?.name} ${req.staff.firstName} ${req.staff.lastName}`,
      );
    }
    res.sendStatus(204);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error en logout" });
  }
}

async function refresh(req: Request, res: Response) {
  try {
    const token = await authService.refresh(req.cookies.refresh_token);
    res.json({ access_token: token });
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 401;
    res.status(statusCode).json({ message: error.message || "Error al refrescar token" });
  }
}

async function me(req: AuthRequest, res: Response) {
  if (!req.staff) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }

  // 1. Extraer objeto plano para evitar fuga de instancias Mongoose
  const staffObj = (req.staff as any).toObject();
  const roleDoc = staffObj.roleId as any;

  // 2. Extraer roleId para limpiar el payload
  const { roleId, ...restStaff } = staffObj;

  // 3. Construir DTO estricto para el Frontend
  const userPayload = {
    ...restStaff,
    role: {
      code: roleDoc?.code,
      level: roleDoc?.level || 0,
      permissions: roleDoc?.permissions || [],
      hasSystemAccess: roleDoc?.hasSystemAccess || false
    }
  };

  res.status(200).json(userPayload);
}

async function changePassword(req: AuthRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    // authMiddleware garantiza req.staff y req.account, pero validamos defensivamente.
    if (!req.account) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    await authService.changePassword(req.account.id, currentPassword, newPassword);

    logger.info(
      `🔐 Contraseña cambiada exitosamente para usuario ${req.account.id}`,
    );
    res.status(200).json({ message: "Contraseña actualizada exitosamente" });
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al cambiar contraseña" });
  }
}

async function getHistory(req: AuthRequest, res: Response) {
  try {
    if (!req.account) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }
    const history = await authService.getLoginHistory(req.account.id);
    res.status(200).json(history);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al obtener historial" });
  }
}

/**
 * POST /api/auth/reset-password
 * Permite al funcionario establecer una contraseña nueva a través del One-Time Link.
 * El token se invalida una vez que la contraseña es guardada con éxito.
 */
async function resetPassword(req: Request, res: Response) {
  try {
    const { token, password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres" });
    }

    // Importación nombrada (no default) para validar el token
    const { validateResetToken } = await import("../services/auth.service");
    const user = await validateResetToken(token);

    user.password = password;
    // Invalida el token borrándolo de la BD — el link queda inutilizable tras este punto
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: "Contraseña restablecida exitosamente" });
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al restablecer contraseña" });
  }
}

export default { login, logout, refresh, me, changePassword, getHistory, resetPassword };


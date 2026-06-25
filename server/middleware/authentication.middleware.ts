import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";
import logger from "../config/logger.config";

export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Middleware de Autenticación (JWT Strategy)
 * Verifica la presencia y validez del token Bearer en cada solicitud protegida.
 * Decisión de Diseño: Se consulta la BD en cada request para asegurar que cambios críticos
 * (ej: bloqueo de usuario) tengan efecto inmediato, sacrificando latencia por seguridad.
 */
async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader =
      req.headers.authorization || (req.headers as any).Authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Acceso no autorizado: se requiere token",
      });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string,
      async (err: any, decoded: any) => {
        if (err) {
          return res.status(403).json({
            success: false,
            message: "Token inválido o expirado",
          });
        }

        // Recuperación del Contexto de Usuario
        // Filtramos campos sensibles (password, refresh_token) preventivamente.
        const user = await User.findById(decoded.id)
          .select("-password -refresh_token")
          .exec();

        if (!user) {
          return res.status(401).json({
            success: false,
            message: "Usuario no encontrado",
          });
        }

        req.user = user as IUser;
        next();
      },
    );
  } catch (error) {
    logger.error(`❌ Error en authMiddleware: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Error interno de autenticación",
    });
  }
}

/**
 * Middleware de Validación de Rol (RBAC) - Admin
 * Shortcut específico para proteger rutas críticas de infraestructura.
 */
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Acceso denegado: usuario no autenticado",
    });
  }

  // Jerarquía Estática: ADMIN-TI se considera Super Admin hardcodeado
  // para evitar bloqueos si la BD de permisos se corrompe.
  if (req.user.tipo_cargo !== "ADMIN-TI") {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado: se requieren privilegios de administrador",
    });
  }

  next();
}

import Cargo from "../models/cargo.model";

/**
 * Factory de Middleware para Permisos Granulares
 * Permite definir políticas de acceso dinámicas basadas en las capacidades ('capabilities') del cargo,
 * en lugar de validar roles fijos ('users.create' vs 'es_jefe').
 */
export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Acceso denegado: usuario no autenticado",
      });
    }

    try {
      const cargo = await Cargo.findOne({ nombre: req.user.tipo_cargo });

      if (!cargo) {
        // Política de Fallo Seguro (Fail-Close):
        // Si el cargo no existe en la configuración actual, se deniega el acceso por defecto.
        return res.status(403).json({
          success: false,
          message: "Acceso denegado: rol no configurado en el sistema",
        });
      }

      // Bypass Maestro: Nivel 100 garantiza acceso total de emergencia.
      if (cargo.nivel === 100) {
        return next();
      }

      // Verificación de Capacidad Específica
      if (cargo.permisos && cargo.permisos.includes(permission)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Acceso denegado: se requiere el permiso '${permission}'`,
      });
    } catch (error) {
      console.error("Error verificando permisos:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error verificando permisos" });
    }
  };
};

export default authMiddleware;

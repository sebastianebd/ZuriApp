import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import Account from '../models/account.model';
import Staff, { IStaff } from '../models/staff.model';
import logger from "../config/logger.config";

import { IRole } from "../models/role.model";

export interface AuthContext extends Omit<IStaff, 'roleId'> {
  roleId: IRole; // Populated
}

export interface AuthRequest extends Request {
  staff?: AuthContext;
  account?: {
    id: string;
    rut: string;
    name: string;
  };
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

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Acceso no autorizado: formato de token inválido",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as jwt.JwtPayload;

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Token inválido: payload incompleto",
      });
    }

    // Recuperación del Contexto de Usuario usando los nuevos modelos
    const account = await Account.findById(decoded.id).exec();
    
    if (!account || !account.isActive) {
      return res.status(401).json({
        success: false,
        message: "Cuenta de usuario inactiva o eliminada",
      });
    }

    const staff = await Staff.findById(account.staffId).populate('roleId').exec();
    
    if (!staff || staff.isDeleted) {
      return res.status(401).json({
        success: false,
        message: "Cuenta de usuario inactiva o eliminada",
      });
    }

    const role = staff.roleId as unknown as IRole;
    if (!role || !role.hasSystemAccess) {
      return res.status(403).json({
        success: false,
        message: "Su rol actual no tiene acceso al sistema",
      });
    }

    // Asignamos el contexto (Staff con Role poblado)
    req.staff = staff as unknown as AuthContext;
    req.account = {
      id: account._id.toString(),
      rut: account.rut,
      name: `${staff.firstName} ${staff.lastName}`,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({
        success: false,
        message: "Token inválido o expirado",
      });
    }
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
  if (!req.staff) {
    return res.status(401).json({
      success: false,
      message: "Acceso denegado: usuario no autenticado",
    });
  }

  // Jerarquía Estática: Nivel 100 se considera Super Admin
  if (req.staff.roleId.level !== 100) {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado: se requieren privilegios de administrador",
    });
  }

  next();
}

/**
 * Factory de Middleware para Permisos Granulares
 * Permite definir políticas de acceso dinámicas basadas en los permisos (permissions) del rol.
 */
export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.staff || !req.staff.roleId) {
      return res.status(401).json({
        success: false,
        message: "Acceso denegado: usuario no autenticado o sin rol válido",
      });
    }

    try {
      const role = req.staff.roleId;

      // Bypass Maestro: Nivel 100 garantiza acceso total de emergencia.
      if (role.level === 100) {
        return next();
      }

      // Verificación de Permiso Específico
      if (role.permissions && role.permissions.includes(permission)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Acceso denegado: se requiere el permiso '${permission}'`,
      });
    } catch (error) {
      logger.error(`Error verificando permisos: ${error}`);
      return res
        .status(500)
        .json({ success: false, message: "Error verificando permisos" });
    }
  };
};

export default authMiddleware;

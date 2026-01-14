import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";
import logger from "../config/logger.config";

export interface AuthRequest extends Request {
  user?: IUser;
}

async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
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

        const user = await User.findById(decoded.id)
          .select("-password -refresh_token")
          .exec();

        if (!user) {
          return res.status(401).json({
            success: false,
            message: "Usuario no encontrado",
          });
        }

        // We assign the user document to req.user.
        // Using 'as unknown as IUser' if simple casting fails, but usually Document compatible if interface matches well?
        // Actually user is a Mongoose Document.
        req.user = user as IUser;
        next();
      }
    );
  } catch (error) {
    logger.error(`❌ Error en authMiddleware: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Error interno de autenticación",
    });
  }
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Acceso denegado: usuario no autenticado",
    });
  }

  // Assuming 'ADMIN-TI' is the super admin role based on user model logic
  if (req.user.tipo_cargo !== "ADMIN-TI") {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado: se requieren privilegios de administrador",
    });
  }

  next();
}

import Cargo from "../models/cargo.model";

export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Acceso denegado: usuario no autenticado",
      });
    }

    try {
      // Fetch the Cargo definition to check permissions
      const cargo = await Cargo.findOne({ nombre: req.user.tipo_cargo });

      if (!cargo) {
        // Fallback: If cargo not found in DB but is ADMIN-TI string, allow?
        // Safer to Strict deny, but for migration compatibility, we might default to deny.
        // Wait, if cargo doesn't exist, they have NO permissions.
        return res.status(403).json({
          success: false,
          message: "Acceso denegado: rol no configurado en el sistema",
        });
      }

      // Rule #1: Super Admin Bypass (The Master Key)
      if (cargo.nivel === 100) {
        return next();
      }

      // Rule #2: Check specific permission
      if (cargo.permisos && cargo.permisos.includes(permission)) {
        return next();
      }

      // Deny
      return res.status(403).json({
        success: false,
        message: `Acceso denegado: se requiere el permiso '${permission}'`,
      });
    } catch (error) {
      console.error("Error checking permissions:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error verificando permisos" });
    }
  };
};

export default authMiddleware;

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

export default authMiddleware;

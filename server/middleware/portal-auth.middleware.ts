import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Staff from '../models/staff.model';
import { PORTAL_JWT_SECRET } from '../services/pwa-auth.service';

export const portalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.zuriapp_pwa_session;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Sesión expirada o no autorizada',
      });
    }

    const secret = PORTAL_JWT_SECRET;

    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Sesión expirada o no autorizada',
      });
    }

    if (!decoded || !decoded.staffId) {
      return res.status(401).json({
        success: false,
        message: 'Sesión expirada o no autorizada',
      });
    }

    const staff = await Staff.findById(decoded.staffId).populate('positionId');
    if (!staff || !staff.isActive || staff.isDeleted) {
      return res.status(401).json({
        success: false,
        message: 'Funcionario inactivo o no autorizado',
      });
    }

    req.staff = staff;
    next();
  } catch (error) {
    next(error);
  }
};

export default portalAuthMiddleware;

import { Request, Response, NextFunction } from 'express';
import PwaAuthService from '../services/pwa-auth.service';

export const requestOtpHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rut } = req.body;
    const result = await PwaAuthService.requestOtp(rut);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const verifyOtpHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rut, otp } = req.body;
    const { token, profile } = await PwaAuthService.verifyOtp(rut, otp);

    res.cookie('zuriapp_pwa_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    });

    return res.status(200).json({
      success: true,
      message: 'Sesión iniciada exitosamente',
      data: {
        staff: profile,
        user: profile,
      },
      user: profile,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const getMeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Aislamiento Anti-IDOR: se ignora cualquier query param o body
    const staffId = (req as any).staff._id.toString();
    const profile = await PwaAuthService.getMe(staffId);

    return res.status(200).json({
      success: true,
      data: {
        staff: profile,
        user: profile,
      },
      user: profile,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const logoutHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.clearCookie('zuriapp_pwa_session', {
      httpOnly: true,
      sameSite: 'lax',
    });

    return res.status(200).json({
      success: true,
      message: 'Sesión finalizada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  requestOtpHandler,
  verifyOtpHandler,
  getMeHandler,
  logoutHandler,
};

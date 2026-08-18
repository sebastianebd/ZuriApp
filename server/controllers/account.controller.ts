import { Response } from 'express';
import accountService from '../services/account.service';
import logger from '../config/logger.config';
import { AuthRequest } from "../middleware/authentication.middleware";

export const toggleAccountStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userRoleLevel = req.staff?.roleId?.level || 0;
    const account = await accountService.toggleAccountStatus(
      req.params.staffId,
      req.body.isActive,
      userRoleLevel,
      req.account!
    );
    
    res.status(200).json(account);
  } catch (error: any) {
    logger.error(`Error in toggleAccountStatus: ${error.message}`);
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al actualizar estado de cuenta", error });
  }
};

export const sendResetLink = async (req: AuthRequest, res: Response) => {
  try {
    const userRoleLevel = req.staff?.roleId?.level || 0;
    await accountService.sendResetLink(req.params.staffId, userRoleLevel, req.account!);
    res.status(200).json({ message: "Enlace de restablecimiento enviado exitosamente" });
  } catch (error: any) {
    logger.error(`Error in sendResetLink: ${error.message}`);
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al enviar enlace", error });
  }
};

export const getAccountStatus = async (req: AuthRequest, res: Response) => {
  try {
    const status = await accountService.getAccountStatus(req.params.staffId);
    res.status(200).json(status);
  } catch (error: any) {
    logger.error(`Error in getAccountStatus: ${error.message}`);
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al obtener estado de la cuenta", error });
  }
};

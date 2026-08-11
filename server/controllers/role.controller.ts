import { Request, Response } from 'express';
import roleService from '../services/role.service';
import logger from '../config/logger.config';

export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await roleService.getRoles();
    res.status(200).json(roles);
  } catch (error: any) {
    logger.error(`Error in getRoles: ${error.message}`);
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al obtener roles", error });
  }
};

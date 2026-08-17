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

export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, code, level, permissions, hasSystemAccess, description } = req.body;
    const role = await roleService.createRole({ name, code, level, permissions, hasSystemAccess, description });
    res.status(201).json(role);
  } catch (error: any) {
    logger.error(`Error in createRole: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, level, permissions, hasSystemAccess, description } = req.body;
    const role = await roleService.updateRole(id, { name, code, level, permissions, hasSystemAccess, description });
    res.status(200).json(role);
  } catch (error: any) {
    logger.error(`Error in updateRole: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = await roleService.deleteRole(id);
    res.status(200).json({ success: true, role });
  } catch (error: any) {
    logger.error(`Error in deleteRole: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

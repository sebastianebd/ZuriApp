import { Request, Response } from 'express';
import staffService from '../services/staff.service';
import logger from '../config/logger.config';
import auditService from "../services/audit.service";
import { AuthRequest } from "../middleware/authentication.middleware";
export const createStaff = async (req: AuthRequest, res: Response) => {
  try {
    const userRoleLevel = req.staff?.roleId?.level || 0;
    const staff = await staffService.onboardStaff(req.body, userRoleLevel);
    
    await auditService.logAction(
      "CREAR",
      "Funcionarios",
      req.account!,
      `Se creó al usuario RUT ${req.body.rut} ${req.body.firstName} ${req.body.lastName}`,
      req.body,
      staff._id as string,
    );
    res.status(201).json(staff);
  } catch (error: any) {
    logger.error(`Error in createStaff: ${error.message}`);
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al crear staff", error });
  }
};

export const updateStaff = async (req: AuthRequest, res: Response) => {
  try {
    const original: any = await staffService.getStaffById(req.params.id);
    const userRoleLevel = req.staff?.roleId?.level || 0;
    const staff = await staffService.updateStaff(req.params.id, req.body, userRoleLevel);
    
    const diff = auditService.generateDiff(original, req.body, "Staff");
    const nombreUsuario = original
      ? `${original.firstName} ${original.lastName}`
      : `ID ${req.params.id}`;
    const descripcion = diff
      ? `Se modificó al usuario ${nombreUsuario} (Cambios: ${diff})`
      : `Se modificó al usuario ${nombreUsuario} (Sin cambios detectados)`;

    await auditService.logAction(
      "MODIFICAR",
      "Funcionarios",
      req.account!,
      descripcion,
      req.body,
      req.params.id,
    );
    res.status(200).json(staff);
  } catch (error: any) {
    logger.error(`Error in updateStaff: ${error.message}`);
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al actualizar staff", error });
  }
};

export const deleteStaff = async (req: AuthRequest, res: Response) => {
  try {
    const staffToDelete: any = await staffService.getStaffById(req.params.id);
    const userRoleLevel = req.staff?.roleId?.level || 0;
    const staff = await staffService.deleteStaff(req.params.id, userRoleLevel);
    
    await auditService.logAction(
      "ELIMINAR",
      "Funcionarios",
      req.account!,
      staffToDelete
        ? `Se eliminó al usuario RUT ${staffToDelete.rut} ${staffToDelete.firstName} ${staffToDelete.lastName}`
        : `Se eliminó al usuario ID ${req.params.id}`,
      null,
      req.params.id,
    );
    res.status(200).json(staff);
  } catch (error: any) {
    logger.error(`Error in deleteStaff: ${error.message}`);
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al eliminar staff", error });
  }
};

export const getStaffById = async (req: Request, res: Response) => {
  try {
    const staff = await staffService.getStaffById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff no encontrado' });
    }
    res.status(200).json(staff);
  } catch (error: any) {
    logger.error(`Error in getStaffById: ${error.message}`);
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al obtener staff", error });
  }
};

export const getAllStaff = async (req: AuthRequest, res: Response) => {
  try {
    const userRoleLevel = req.staff?.roleId?.level || 0;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const rut = (req.query.rut as string) || "";
    const roleId = (req.query.roleId as string) || "";
    const positionId = (req.query.positionId as string) || "";
    const isActiveQuery = req.query.isActive as string;
    let isActive: boolean | undefined = undefined;
    if (isActiveQuery === 'true') isActive = true;
    else if (isActiveQuery === 'false') isActive = false;

    const result = await staffService.getAllStaff({
      search,
      rut,
      roleId,
      positionId,
      isActive,
      page,
      limit,
      userRoleLevel,
    });

    res.json(result);
  } catch (error: any) {
    logger.error(`Error in getAllStaff: ${error.message}`);
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al obtener staff", error });
  }
};


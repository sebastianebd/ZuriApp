import { Request, Response } from "express";
import profileService from "../services/profile.service";
import { AuthRequest } from "../middleware/authentication.middleware";

async function getReplacementStats(req: AuthRequest, res: Response) {
  try {
    // Extracción segura del ID de usuario desde el token JWT decodificado (req.staff)
    // Se soporta tanto la propiedad 'id' (virtual) como '_id' (bson) para robustez.
    const staffId = req.staff?.id || (req.staff as any)?._id;

    const stats = await profileService.getStaffReplacementStats(staffId);
    res.json(stats);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({
      message: error.message || "Error al obtener estadísticas de reemplazos", error
    });
  }
}

async function getServiceStats(req: AuthRequest, res: Response) {
  try {
    const staffId = req.staff?.id || (req.staff as any)?._id;
    const stats = await profileService.getStaffServiceStats(staffId);
    res.json(stats);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({
      message: error.message || "Error al obtener estadísticas de servicios", error
    });
  }
}

async function getRecentActivity(req: AuthRequest, res: Response) {
  try {
    const accountId = req.account?.id || (req.account as any)?._id;
    const activities = await profileService.getAccountRecentActivity(accountId);
    res.json(activities);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({
      message: error.message || "Error al obtener actividad reciente", error
    });
  }
}

export default {
  getReplacementStats,
  getServiceStats,
  getRecentActivity,
};

import { Request, Response } from "express";
import profileService from "../services/profile.service";
import { AuthRequest } from "../middleware/authentication.middleware";

async function getReplacementStats(req: AuthRequest, res: Response) {
  try {
    // Extracción segura del ID de usuario desde el token JWT decodificado (req.user)
    // Se soporta tanto la propiedad 'id' (virtual) como '_id' (bson) para robustez.
    const userId = req.user?.id || (req.user as any)?._id;

    const stats = await profileService.getUserReplacementStats(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({
      mensaje: error.message || "Error al obtener estadísticas de reemplazos",
    });
  }
}

async function getServiceStats(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id || (req.user as any)?._id;
    const stats = await profileService.getUserServiceStats(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({
      mensaje: error.message || "Error al obtener estadísticas de servicios",
    });
  }
}

async function getRecentActivity(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id || (req.user as any)?._id;
    const activities = await profileService.getUserRecentActivity(userId);
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({
      mensaje: error.message || "Error al obtener actividad reciente",
    });
  }
}

export default {
  getReplacementStats,
  getServiceStats,
  getRecentActivity,
};

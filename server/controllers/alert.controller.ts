import { Response } from "express";
import { AuthRequest } from "../middleware/authentication.middleware";
import alertService from "../services/alert.service";
import { resolveAlertSchema } from "../schemas/alert.schema";
import logger from "../config/logger.config";

export const getAlertsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const serviceId = req.query.serviceId as string | undefined;
    const status = req.query.status as string | undefined;

    const isAdmin =
      req.staff?.roleId?.level === 100 ||
      (req.staff?.roleId as any)?.code === "ADMIN";
    const staffId = req.staff?._id?.toString() || (req.staff as any)?.id;

    const data = await alertService.getAlerts({
      serviceId,
      status,
      user: { staffId, isAdmin },
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error(`[AlertController] Error en getAlertsHandler: ${error.message}`);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Error al obtener las alertas",
    });
  }
};

export const acknowledgeAlertHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const staffId = req.staff?._id?.toString() || (req.staff as any)?.id;

    const alert = await alertService.acknowledgeAlert(id, staffId);

    return res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (error: any) {
    logger.error(
      `[AlertController] Error en acknowledgeAlertHandler: ${error.message}`,
    );
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Error al reconocer la alerta",
    });
  }
};

export const resolveAlertHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validation = resolveAlertSchema.safeParse(req.body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        message: firstError?.message || "La justificación es requerida",
        errors: validation.error.format(),
      });
    }

    const staffId = req.staff?._id?.toString() || (req.staff as any)?.id;
    const alert = await alertService.resolveAlert(
      id,
      validation.data.resolutionNote,
      staffId,
    );

    return res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (error: any) {
    logger.error(
      `[AlertController] Error en resolveAlertHandler: ${error.message}`,
    );
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Error al resolver la alerta",
    });
  }
};

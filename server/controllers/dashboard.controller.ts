import { Request, Response } from "express";
import dayjs from "dayjs";
import dashboardService from "../services/dashboard.service";
import { AuthRequest } from "../middleware/authentication.middleware";
import logger from "../config/logger.config";

export const getServiceKPIsHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { serviceId } = req.params;
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: "El parámetro serviceId es requerido",
      });
    }

    const currentDayjs = dayjs();
    const month = req.query.month
      ? parseInt(req.query.month as string, 10)
      : currentDayjs.month() + 1;
    const year = req.query.year
      ? parseInt(req.query.year as string, 10)
      : currentDayjs.year();

    if (isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "El parámetro month debe ser un número entre 1 y 12",
      });
    }

    if (isNaN(year) || year < 2020) {
      return res.status(400).json({
        success: false,
        message: "El parámetro year debe ser un número mayor o igual a 2020",
      });
    }

    const accountStaffId = req.staff?._id?.toString();
    const staffRole = req.staff?.roleId;
    const bypassCache = req.query.refresh === "true";

    const kpis = await dashboardService.getServiceKPIs(
      serviceId,
      month,
      year,
      accountStaffId,
      staffRole,
      bypassCache,
    );

    return res.status(200).json({
      success: true,
      data: kpis,
    });
  } catch (error: any) {
    logger.error(`[DashboardController] Error en getServiceKPIsHandler: ${error.message}`);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Error interno al calcular KPIs del servicio",
    });
  }
};

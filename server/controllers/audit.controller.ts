import { Request, Response } from "express";
import auditService from "../services/audit.service";
import logger from "../config/logger.config";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../constants/audit.constants";

async function getAuditLogs(req: Request, res: Response) {
  try {
    const {
      page = 1,
      limit = 10,
      module,
      action,
      startDate,
      endDate,
      userId,
    } = req.query;

    const filters = {
      module: module as string,
      action: action as string,
      accountId: userId as string, // La query espera accountId, aunque el req diga userId
      startDate: startDate as string,
      endDate: endDate as string,
    };

    const response = await auditService.getLogs(
      filters,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );

    res.json(response);
  } catch (error: any) {
    logger.error(`Error en getAuditLogs: ${error.message}`);
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al obtener logs de auditoría", error });
  }
}

function getAuditOptions(req: Request, res: Response) {
  res.json({
    modules: Object.values(AUDIT_MODULES),
    actions: Object.values(AUDIT_ACTIONS),
  });
}

export default {
  getAuditLogs,
  getAuditOptions,
};

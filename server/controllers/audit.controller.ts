import { Request, Response } from "express";
import auditService from "../services/audit.service";
import AuditLog from "../models/audit.model";
import logger from "../config/logger.config";
import { get, set } from "../config/redis.config";

async function getAuditLogs(req: Request, res: Response) {
  try {
    // Cache Key based on all query params
    const cacheKey = `audit:${JSON.stringify(req.query)}`;
    const cachedData = await get(cacheKey);
    if (cachedData) return res.json(cachedData);

    const {
      page = 1,
      limit = 10,
      module,
      action,
      startDate,
      endDate,
      userId,
    } = req.query;

    const query: any = {};
    if (module) query.module = module;
    if (action) query.action = action;
    if (userId) query.userId = userId;

    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) query.created_at.$gte = new Date(startDate as string);
      if (endDate) query.created_at.$lte = new Date(endDate as string);
    }

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sort: { created_at: -1 }, // Changed from timestamp to created_at
      lean: true,
    };

    // Correct calling of paginate via Model (needs type assertion if not fully typed)
    const result = await (AuditLog as any).paginate(query, options);

    const response = {
      logs: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      currentPage: result.page,
    };

    await set(cacheKey, response, 300); // Cache for 5 mins
    res.json(response);
  } catch (error: any) {
    logger.error(`Error en getAuditLogs: ${error.message}`);
    res.status(500).json({ message: "Error al obtener logs de auditoría" });
  }
}

export default {
  getAuditLogs,
};

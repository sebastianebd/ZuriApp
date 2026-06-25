import { Request, Response } from "express";
import auditService from "../services/audit.service";
import AuditLog from "../models/audit.model";
import logger from "../config/logger.config";
import { get, set } from "../config/redis.config";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../constants/audit.constants";

async function getAuditLogs(req: Request, res: Response) {
  try {
    // Estrategia de Caching:
    // Se cachea la query exacta (incluyendo filtros y paginación) para reducir carga en Mongo
    // en dashboards de alto tráfico. TTL corto (5 min) para balancear frescura y performance.
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

    // Filtro de Rango de Fechas
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) query.created_at.$gte = new Date(startDate as string);
      if (endDate) query.created_at.$lte = new Date(endDate as string);
    }

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sort: { created_at: -1 }, // Orden descendente (Lo más reciente primero)
      lean: true, // Optimización: Devuelve objetos planos JS en lugar de documentos Mongoose pesados
    };

    // Casting a 'any' necesario porque la definición de tipos de mongoose-paginate-v2
    // a veces entra en conflicto con la compilación estricta de TS en modelos extendidos.
    const result = await (AuditLog as any).paginate(query, options);

    const response = {
      logs: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      currentPage: result.page,
    };

    await set(cacheKey, response, 300); // TTL: 300 segundos (5 minutos)
    res.json(response);
  } catch (error: any) {
    logger.error(`Error en getAuditLogs: ${error.message}`);
    res.status(500).json({ message: "Error al obtener logs de auditoría" });
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

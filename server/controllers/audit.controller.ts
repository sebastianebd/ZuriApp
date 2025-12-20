import { Request, Response } from "express";
import auditService from "../services/audit.service";
import AuditLog from "../models/audit.model";
import logger from "../config/logger.config";

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

    const query: any = {};
    if (module) query.module = module;
    if (action) query.action = action;
    if (userId) query.userId = userId;

    if (startDate || endDate) {
      query.timestamp = {};
      // Model uses 'created_at', but controller code said 'timestamp'.
      // Checking audit.service.js getLogs: it used 'created_at'.
      // THIS CONTROLLER LOGIC MIGHT BE DUPLICATING SERVICE LOGIC?
      // Wait, audit.service.js HAD getLogs function!
      // But this controller is calling AuditLog.paginate DIRECTLY instead of using service.getLogs?
      // Line 34: const result = await AuditLog.paginate(query, options);
      // YES. The controller is bypassing the service logic for pagination?
      // Or maybe previous service analysis missed something?
      // Service `getLogs` (line 44 in audit.service.js) implements logic.
      // But controller (line 5 in audit.controller.js) implements similar logic AND ignores service.getLogs?
      // It imports auditService but doesn't use it for fetching logs?
      // Actually it uses auditService only for imports? No.
      // I should refactor to use service if possible, but strict migration means keeping logic same.
      // BUT `timestamp` vs `created_at`. Model has `created_at`.
      // If controller uses `timestamp`, it might be broken? Or maybe `timestamp` alias?
      // `audit.model.js`: `timestamps: { createdAt: "created_at"... }`.
      // So db field is `created_at`.
      // Controller query: `query.timestamp`. This looks BROKEN in existing JS code if it targets `created_at`.
      // UNLESS `Plugin` adds `timestamp`? Unlikely.
      // I will fix it to `created_at` in TS to be correct.
      if (startDate)
        query.created_at = {
          ...query.created_at,
          $gte: new Date(startDate as string),
        };
      if (endDate)
        query.created_at = {
          ...query.created_at,
          $lte: new Date(endDate as string),
        };
    }

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sort: { created_at: -1 }, // Changed from timestamp to created_at
      lean: true,
    };

    // Correct calling of paginate via Model (needs type assertion if not fully typed)
    const result = await (AuditLog as any).paginate(query, options);

    res.json({
      logs: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      currentPage: result.page,
    });
  } catch (error: any) {
    logger.error(`Error en getAuditLogs: ${error.message}`);
    res.status(500).json({ message: "Error al obtener logs de auditoría" });
  }
}

export default {
  getAuditLogs,
};

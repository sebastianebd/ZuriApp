const auditService = require("../services/audit.service");
const AuditLog = require("../models/audit.model"); // Asegúrate ruta correcta
const logger = require("../config/logger.config");

async function getAuditLogs(req, res) {
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

    const query = {};
    if (module) query.module = module;
    if (action) query.action = action;
    if (userId) query.userId = userId; // Assuming userId is still relevant for filtering
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { timestamp: -1 }, // Más reciente primero
      lean: true,
    };

    const result = await AuditLog.paginate(query, options);

    res.json({
      logs: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      currentPage: result.page,
    });
  } catch (error) {
    logger.error(`Error en getAuditLogs: ${error.message}`);
    res.status(500).json({ message: "Error al obtener logs de auditoría" });
  }
}

module.exports = {
  getAuditLogs,
};

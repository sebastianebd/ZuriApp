const auditService = require("../services/audit.service");

async function getAuditLogs(req, res) {
  try {
    const { page, limit, module, action, startDate, endDate, userId } =
      req.query;

    const filters = {
      module,
      action,
      startDate,
      endDate,
      userId,
    };

    const data = await auditService.getLogs(
      filters,
      parseInt(page) || 1,
      parseInt(limit) || 20
    );

    res.json(data);
  } catch (error) {
    console.error("Error en getAuditLogs:", error);
    res
      .status(500)
      .json({ mensaje: error.message || "Error al obtener auditoría" });
  }
}

module.exports = {
  getAuditLogs,
};

const Reemplazo = require("../models/replacement.model");
const AuditLog = require("../models/audit.model");
const mongoose = require("mongoose");

/**
 * Obtiene estadísticas de reemplazos para un usuario específico.
 * Total creados y creados en el mes actual.
 */
async function getUserReplacementStats(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const [total, monthly] = await Promise.all([
    Reemplazo.countDocuments({ creado_por: userId }),
    Reemplazo.countDocuments({
      creado_por: userId,
      created_at: { $gte: startOfMonth, $lte: endOfMonth },
    }),
  ]);

  return {
    total,
    monthly,
  };
}

/**
 * Obtiene estadísticas de uso de servicios para un usuario específico.
 * Para gráfico de torta (doughnut).
 */
async function getUserServiceStats(userId) {
  const stats = await Reemplazo.aggregate([
    {
      $match: { creado_por: new mongoose.Types.ObjectId(userId) },
    },
    {
      $group: {
        _id: "$servicio",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return stats.map((item) => ({
    servicio: item._id,
    cantidad: item.count,
  }));
}

/**
 * Obtiene los últimos movimientos de un usuario específico.
 */
async function getUserRecentActivity(userId, limit = 5) {
  return await AuditLog.find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(limit)
    .select("action module description created_at");
}

module.exports = {
  getUserReplacementStats,
  getUserServiceStats,
  getUserRecentActivity,
};

import Replacement from "../models/replacement.model";
import AuditLog from "../models/audit.model";
import mongoose from "mongoose";

// Servicio de Perfil (Staff/Account):
// Agrega estadísticas y actividades recientes para el dashboard personal del funcionario.
// Separado de staff.service para mantener alta cohesión en lógica de reporting/stats.

/**
 * Devuelve conteos de reemplazos creados por el staff dado (total y del mes actual).
 * @param staffId - ID del documento Staff (no Account) del funcionario.
 */
async function getStaffReplacementStats(staffId: string) {
  const now = new Date();
  // Cálculo de Rango Mensual: Inicio y Fin del mes actual
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  // Ejecución Paralela:
  // Lanzamos ambas queries de conteo simultáneamente para reducir latencia de respuesta.
  const [total, monthly] = await Promise.all([
    Replacement.countDocuments({ creado_por: staffId }),
    Replacement.countDocuments({
      creado_por: staffId,
      created_at: { $gte: startOfMonth, $lte: endOfMonth },
    }),
  ]);

  return {
    total,
    monthly,
  };
}

async function getStaffServiceStats(staffId: string) {
  // Aggregation Pipeline:
  // Agrupamos reemplazos creados por el usuario según 'servicio' y contamos ocurrencias.
  // Esto permite al usuario ver dónde está asignando más recursos.
  const stats = await Replacement.aggregate([
    {
      $match: { creado_por: new mongoose.Types.ObjectId(staffId) },
    },
    {
      $group: {
        _id: "$servicio",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 }, // Más frecuentes primero
    },
  ]);

  return stats.map((item) => ({
    servicio: item._id,
    cantidad: item.count,
  }));
}

async function getAccountRecentActivity(accountId: string, limit: number = 5) {
  // Auditoría Personal:
  // Permite al usuario ver sus propias acciones recientes en el sistema.
  return await AuditLog.find({ accountId })
    .sort({ created_at: -1 })
    .limit(limit)
    .select("action module description created_at");
}

export default {
  getStaffReplacementStats,
  getStaffServiceStats,
  getAccountRecentActivity,
};

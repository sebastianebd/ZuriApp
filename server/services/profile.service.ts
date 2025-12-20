import Reemplazo from "../models/replacement.model";
import AuditLog from "../models/audit.model";
import mongoose from "mongoose";

async function getUserReplacementStats(userId: string) {
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

async function getUserServiceStats(userId: string) {
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

async function getUserRecentActivity(userId: string, limit: number = 5) {
  return await AuditLog.find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(limit)
    .select("action module description created_at");
}

export default {
  getUserReplacementStats,
  getUserServiceStats,
  getUserRecentActivity,
};

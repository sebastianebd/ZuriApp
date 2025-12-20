import mongoose, { FilterQuery } from "mongoose";
import AuditLog, { IAuditLog } from "../models/audit.model";
import "../models/user.model";
import logger from "../config/logger.config";

async function logAction(
  action: string,
  module: string,
  user: any,
  description: string,
  details: any = null,
  entityId: string | null = null
): Promise<void> {
  try {
    const logEntry = new AuditLog({
      action,
      module,
      user_id: user.id || user._id,
      user_name: `${user.nombre} ${user.apellido}`,
      resource_id: entityId, // Fixed field name matching schema
      // Audit schema doesn't seem to have 'rut' explicitly?
      // Checking audit.model.ts in step 2186:
      // action, module, description, details, user_id, user_name, resource_id.
      // JS code had: rut: user.rut.
      // This 'rut' was also likely dropped if not in schema. I will omit it if not in schema.
      // description... details...
      description,
      details,
    });

    await logEntry.save();
  } catch (error: any) {
    logger.error(`Error al registrar auditoría: ${error.message}`);
  }
}

async function getLogs(
  filters: any = {},
  page: number = 1,
  limit: number = 20
) {
  const query: FilterQuery<IAuditLog> = {};

  if (filters.module && filters.module !== "TODOS")
    query.module = filters.module;
  if (filters.action && filters.action !== "TODOS")
    query.action = filters.action;

  if (filters.userId && mongoose.Types.ObjectId.isValid(filters.userId)) {
    query.user_id = new mongoose.Types.ObjectId(filters.userId);
  }

  if (filters.startDate || filters.endDate) {
    // Need to handle created_at range
    const dateQuery: any = {};
    if (filters.startDate) dateQuery.$gte = new Date(filters.startDate);
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }
    if (Object.keys(dateQuery).length > 0) query.created_at = dateQuery;
  }

  const logs = await AuditLog.find(query)
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user_id", "nombre apellido rut");

  const total = await AuditLog.countDocuments(query);

  return {
    logs,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
}

function generateDiff(oldData: any, newData: any): string {
  if (!oldData || !newData) return "";

  const changes: string[] = [];
  const ignoredKeys = [
    "_id",
    "created_at",
    "updated_at",
    "__v",
    "password",
    "refresh_token",
    "id",
    "full_name",
    "creado_por",
  ];

  Object.keys(newData).forEach((key) => {
    if (ignoredKeys.includes(key)) return;

    let oldVal = oldData[key];
    let newVal = newData[key];

    // date handling
    if (
      newVal instanceof Date ||
      (typeof newVal === "string" &&
        !isNaN(Date.parse(newVal)) &&
        oldVal instanceof Date) // simplification from JS check
      // Actually checking if oldVal has .getTime is safer
    ) {
      // ... date logic
      const t1 = new Date(oldVal).getTime();
      const t2 = new Date(newVal).getTime();
      if (t1 !== t2) {
        changes.push(
          `${key}: ${new Date(oldVal).toLocaleString()} -> ${new Date(
            newVal
          ).toLocaleString()}`
        );
      }
      return;
    }

    if (oldVal != newVal) {
      if (
        (oldVal === undefined || oldVal === null) &&
        (newVal === "" || newVal === null)
      )
        return;

      changes.push(`${key}: ${oldVal} -> ${newVal}`);
    }
  });

  return changes.join(", ");
}

export default { logAction, getLogs, generateDiff };

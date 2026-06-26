import mongoose, { FilterQuery } from "mongoose";
import AuditLog, { IAuditLog } from "../models/audit.model";
import "../models/user.model";
import logger from "../config/logger.config";
import { delPattern } from "../config/redis.config";
import socketIO from "../config/socket";

async function logAction(
  action: string,
  module: string,
  user: any,
  description: string,
  details: any = null,
  entityId: string | null = null,
): Promise<void> {
  try {
    const logEntry = new AuditLog({
      action,
      module,
      user_id: user.id || user._id,
      user_name: `${user.nombre} ${user.apellido}`,
      resource_id: entityId,
      description,
      details,
    });

    await logEntry.save();
    // Cache Invalidation Strategy:
    // Invalidamos todo el patrón audit:* para asegurar consistencia inmediata en listados.
    // Aunque agresivo, garantiza que el admin siempre vea la última acción.
    await delPattern("audit:*");

    // Notificaciones en Tiempo Real (Fire-and-Forget):
    // Emitimos el evento vía Socket.IO para actualizar dashboards de administradores activos.
    // Envolvemos esto en try/catch independiente porque un fallo en el sistema de notificación (o si socketIO no está init)
    // NO debe interrumpir el flujo principal de negocio ni el registro de auditoría.
    try {
      const io = socketIO.getIO();
      io.emit("audit:update", {
        action,
        module,
        user: user.nombre,
        description,
      });
    } catch (err) {
      // Silencioso: Es común en entornos de scripts/tests donde Socket no está levantado.
    }
  } catch (error: any) {
    // Fallback de Seguridad:
    // Si falla el registro de auditoría (ej: DB caída), lo logueamos a archivo/consola
    // para no perder la trazabilidad del error, aunque se pierda el audit record.
    logger.error(`Error al registrar auditoría: ${error.message}`);
  }
}

async function getLogs(
  filters: any = {},
  page: number = 1,
  limit: number = 20,
) {
  const query: FilterQuery<IAuditLog> = {};

  if (filters.module) query.module = filters.module;
  if (filters.action) query.action = filters.action;

  if (filters.userId && mongoose.Types.ObjectId.isValid(filters.userId)) {
    query.user_id = new mongoose.Types.ObjectId(filters.userId);
  }

  if (filters.startDate || filters.endDate) {
    // Manejo de rangos de fecha para created_at
    const dateQuery: any = {};
    if (filters.startDate) dateQuery.$gte = new Date(filters.startDate);
    if (filters.endDate) {
      // Ajustamos al final del día para incluir registros ocurridos durante la fecha de término.
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
  // Lista Negra de Campos:
  // Excluimos campos técnicos o sensibles que no aportan valor semántico al historial de cambios visible por el usuario.
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
    "updatedAt",
  ];

  Object.keys(newData).forEach((key) => {
    if (ignoredKeys.includes(key)) return;

    let oldVal = oldData[key];
    let newVal = newData[key];

    // Manejo Especial: Fechas
    // Comparamos timestamps para evitar falsos positivos por formatos de string distintos.
    if (
      (newVal instanceof Date ||
        (typeof newVal === "string" && !isNaN(Date.parse(newVal)))) &&
      oldVal
    ) {
      const t1 = new Date(oldVal).getTime();
      const t2 = new Date(newVal).getTime();
      if (!isNaN(t1) && !isNaN(t2) && t1 !== t2) {
        changes.push(
          `${key}: ${new Date(t1).toLocaleString()} -> ${new Date(
            t2,
          ).toLocaleString()}`,
        );
      }
      return;
    }

    // Manejo Especial: Secuencia de Turnos (TurnType)
    // Desglosamos cambios dentro de la estructura compleja de array de objetos 'secuencia'
    // para reportar legiblemente qué día cambió y qué propiedad (horario, sigla, etc).
    if (key === "secuencia" && Array.isArray(oldVal) && Array.isArray(newVal)) {
      const seqChanges: string[] = [];
      newVal.forEach((newDay: any) => {
        const oldDay = oldVal.find((d: any) => d.dia === newDay.dia);
        if (!oldDay) {
          seqChanges.push(`Día ${newDay.dia}: Nuevo`);
        } else {
          // Compare fields within the day
          const dayUpdates: string[] = [];

          // Sigla
          if (oldDay.sigla !== newDay.sigla)
            dayUpdates.push(`Sigla: ${oldDay.sigla} -> ${newDay.sigla}`);

          // Horarios
          const oldTime = `${oldDay.turno_entrada || "vacío"} - ${
            oldDay.turno_salida || "vacío"
          }`;
          const newTime = `${newDay.turno_entrada || "vacío"} - ${
            newDay.turno_salida || "vacío"
          }`;
          if (oldTime !== newTime)
            dayUpdates.push(`Horario: ${oldTime} -> ${newTime}`);

          if (oldDay.es_libre !== newDay.es_libre)
            dayUpdates.push(`Libre: ${oldDay.es_libre} -> ${newDay.es_libre}`);

          if (dayUpdates.length > 0) {
            seqChanges.push(`Día ${newDay.dia}: [ ${dayUpdates.join(", ")} ]`);
          }
        }
      });
      if (seqChanges.length > 0) {
        changes.push(`${key}: ${seqChanges.join("; ")}`);
      }
      return;
    }

    // Comparación Profunda Genérica
    // Para objetos/arrays no manejados específicamente, usamos stringify como fallback.
    if (typeof newVal === "object" && newVal !== null && oldVal !== undefined) {
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        const oldStr = JSON.stringify(oldVal, null, 1).replace(/\n/g, "");
        const newStr = JSON.stringify(newVal, null, 1).replace(/\n/g, "");
        changes.push(`${key}: ${oldStr} -> ${newStr}`);
      }
      return;
    }

    // Comparación Simple de Primitivos
    if (oldVal != newVal) {
      // Ignoramos transiciones de null/undefined a string vacío para reducir ruido
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

const mongoose = require("mongoose");
const AuditLog = require("../models/audit.model");
// Asegurar que el modelo User esté registrado para el populate
require("../models/user.model");

/**
 * Registra una acción en la auditoría
 * @param {string} action - Acción realizada (CREAR, MODIFICAR...)
 * @param {string} module - Módulo afectado (USUARIOS, REEMPLAZOS...)
 * @param {string} description - Descripción humana
 * @param {Object} user - Objeto usuario que realizó la acción ({_id, nombre, apellido})
 * @param {Object} details - Detalles técnicos o payload
 * @param {string} resourceId - ID del recurso afectado
 */
async function logAction(
  action,
  module,
  user,
  description,
  details = null,
  entityId = null
) {
  try {
    const logEntry = new AuditLog({
      action,
      module,
      user_id: user.id, // ID del usuario que realizó la acción
      user_name: `${user.nombre} ${user.apellido}`, // Nombre legible
      rut: user.rut,
      description,
      details,
      entity_id: entityId,
    });

    await logEntry.save();
  } catch (error) {
    logger.error(`Error al registrar auditoría: ${error.message}`); // Fallo silencioso para no bloquear el flujo principal
  }
}

/**
 * Obtiene logs paginados y filtrados
 */
async function getLogs(filters = {}, page = 1, limit = 20) {
  const query = {};

  if (filters.module && filters.module !== "TODOS")
    query.module = filters.module;
  if (filters.action && filters.action !== "TODOS")
    query.action = filters.action;

  // Filtro por usuario (SOLO si es un ID válido)
  if (filters.userId && mongoose.Types.ObjectId.isValid(filters.userId)) {
    query.user_id = filters.userId;
  }

  // Filtro por rango de fechas
  if (filters.startDate || filters.endDate) {
    query.created_at = {};
    if (filters.startDate) query.created_at.$gte = new Date(filters.startDate);
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      query.created_at.$lte = end;
    }
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
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Genera un string con las diferencias entre el objeto original y el nuevo.
 * @param {Object} oldData - Objeto original (DB)
 * @param {Object} newData - Objeto con cambios (req.body)
 * @returns {string} - Descripción de cambios "Campo: antes -> ahora"
 */
function generateDiff(oldData, newData) {
  if (!oldData || !newData) return "";

  const changes = [];
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

    // Manejo de Fechas
    if (
      newVal instanceof Date ||
      (typeof newVal === "string" &&
        !isNaN(Date.parse(newVal)) &&
        typeof oldVal?.getTime === "function")
    ) {
      const d1 = new Date(oldVal).toISOString().split("T")[0];
      const d2 = new Date(newVal).toISOString().split("T")[0]; // Comparar solo fecha YYYY-MM-DD si es suficiente, o usar getTime()
      // Para mayor precisión usemos getTime pero en string legible
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

    // Igualdad laxa para manejar "1" vs 1
    if (oldVal != newVal) {
      // Evitar falsos positivos con undefined vs null o ''
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

module.exports = {
  logAction,
  getLogs,
  generateDiff,
};

import TurnType from "../models/turn-type.model";
import auditService from "../services/audit.service";
import { AppError } from "../errors/app-error";
import { escapeRegex } from "../utils/regex";

/**
 * Servicio para gestionar los Tipos de Turno (Configuración de jornadas y secuencias).
 */

async function getTurnTypes(all: boolean) {
  const filter: any = all ? {} : { activo: true };
  filter.deleted_at = null;
  return await TurnType.find(filter).sort({ nombre: 1 });
}

async function createTurnType(validatedData: any, currentUser: any) {
  const existing = await TurnType.findOne({
    nombre: { $regex: new RegExp(`^${escapeRegex(validatedData.nombre)}$`, "i") },
    deleted_at: null,
  });

  if (existing) {
    throw new AppError(409, "El tipo de turno ya existe");
  }

  const words = validatedData.nombre.trim().split(/\s+/);
  let prefix = "";
  if (words.length === 1) {
    prefix = words[0].substring(0, 3).toUpperCase();
  } else {
    const first = words[0].substring(0, 1);
    const second = words[1].substring(0, 2);
    prefix = (first + second).toUpperCase();
  }

  const allTurnTypes = await TurnType.find({
    codigo: { $exists: true, $ne: null },
  }).select("codigo");

  let maxSeq = 0;
  allTurnTypes.forEach((t) => {
    if (t.codigo && t.codigo.includes("-")) {
      const parts = t.codigo.split("-");
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  });

  const sequence = maxSeq + 1;
  const codigo = `${prefix}-${sequence.toString().padStart(3, "0")}`;

  const turnType = await TurnType.create({ ...validatedData, codigo });

  if (currentUser) {
    await auditService.logAction(
      "CREAR",
      "Tipos de Turno",
      currentUser,
      `Creó el tipo de turno: ${turnType.nombre} (${turnType.codigo})`,
      turnType,
      turnType._id.toString()
    );
  }

  return turnType;
}

async function updateTurnType(id: string, validatedData: any, currentUser: any) {
  const existing = await TurnType.findOne({
    nombre: { $regex: new RegExp(`^${escapeRegex(validatedData.nombre)}$`, "i") },
    deleted_at: null,
    _id: { $ne: id },
  });

  if (existing) {
    throw new AppError(409, "Ya existe un tipo de turno con este nombre");
  }

  const oldTurnType = await TurnType.findById(id);
  if (!oldTurnType) {
    throw new AppError(404, "Tipo de turno no encontrado");
  }

  const turnType = await TurnType.findByIdAndUpdate(id, validatedData, {
    new: true,
  });

  if (turnType && currentUser) {
    const diff = auditService.generateDiff(
      oldTurnType.toObject(),
      turnType.toObject(),
      "TurnType"
    );

    if (diff) {
      const description = `Modificó el tipo de turno: ${turnType.nombre} (${turnType.codigo}). Cambios: [${diff}]`;

      await auditService.logAction(
        "MODIFICAR",
        "Tipos de Turno",
        currentUser,
        description,
        { old: oldTurnType, new: validatedData, diff },
        turnType._id.toString()
      );
    }
  }

  return turnType;
}

async function deleteTurnType(id: string, currentUser: any) {
  const turnType = await TurnType.findByIdAndUpdate(
    id,
    { activo: false, deleted_at: new Date() },
    { new: true }
  );

  if (!turnType) {
    throw new AppError(404, "Tipo de turno no encontrado");
  }

  if (currentUser) {
    await auditService.logAction(
      "ELIMINAR",
      "Tipos de Turno",
      currentUser,
      `Se eliminó el turno: ${turnType.nombre} (${turnType.codigo})`,
      null,
      turnType._id.toString()
    );
  }

  return turnType;
}

export default {
  getTurnTypes,
  createTurnType,
  updateTurnType,
  deleteTurnType,
};

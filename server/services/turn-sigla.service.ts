import { TurnSigla } from "../models/turn-sigla.model";
import auditService from "../services/audit.service";
import { AppError } from "../errors/app-error";

/**
 * Servicio para gestionar las Siglas de Turno.
 */

async function getTurnSiglas(all: boolean) {
  const filter: any = all ? {} : { activo: true };
  filter.deleted_at = null;
  return await TurnSigla.find(filter).sort({ sigla: 1 });
}

async function createTurnSigla(data: any, currentUser: any) {
  const { sigla } = data;
  const existing = await TurnSigla.findOne({ sigla, deleted_at: null });
  
  if (existing) {
    throw new AppError(400, "La sigla ya existe");
  }

  const newSigla = new TurnSigla(data);
  await newSigla.save();

  if (currentUser) {
    const times =
      newSigla.turno_entrada && newSigla.turno_salida
        ? ` ${newSigla.turno_entrada} - ${newSigla.turno_salida}`
        : "";
    await auditService.logAction(
      "CREAR",
      "Tipos Turno",
      currentUser,
      `Creó la sigla: ${newSigla.sigla} - ${newSigla.nombre}${times}`,
      newSigla,
      newSigla._id.toString()
    );
  }

  return newSigla;
}

async function updateTurnSigla(id: string, data: any, currentUser: any) {
  const existing = await TurnSigla.findById(id);

  if (!existing) {
    throw new AppError(404, "Sigla no encontrada");
  }

  const updated = await TurnSigla.findByIdAndUpdate(id, data, {
    new: true,
  });

  if (updated && currentUser) {
    const diff = auditService.generateDiff(
      (existing as any).toObject(),
      updated.toObject(),
      "TurnSigla"
    );

    if (diff) {
      const description = `Modificó la sigla: ${updated.sigla}. Cambios: [${diff}]`;

      await auditService.logAction(
        "MODIFICAR",
        "Tipos Turno",
        currentUser,
        description,
        { old: existing, new: data, diff },
        updated._id.toString()
      );
    }
  }

  return updated;
}

async function deleteTurnSigla(id: string, currentUser: any) {
  const deleted = await TurnSigla.findByIdAndUpdate(
    id,
    { activo: false, deleted_at: new Date() },
    { new: true }
  );

  if (!deleted) {
    throw new AppError(404, "Sigla no encontrada");
  }

  if (currentUser) {
    await auditService.logAction(
      "ELIMINAR",
      "Tipos Turno",
      currentUser,
      `Se eliminó la sigla: ${deleted.sigla} - ${deleted.nombre}`,
      null,
      deleted._id.toString()
    );
  }

  return deleted;
}

export default {
  getTurnSiglas,
  createTurnSigla,
  updateTurnSigla,
  deleteTurnSigla,
};

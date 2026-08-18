import mongoose from "mongoose";
import Period from "../models/period.model";
import ReportSnapshot from "../models/report-snapshot.model";
import auditService from "../services/audit.service";
import { AppError } from "../errors/app-error";

/**
 * Servicio para gestionar los Períodos de reporte (cierre de mes y excepciones).
 */

async function getPeriod(month: number, year: number) {
  const period = await Period.findOne({ month, year });
  return period ?? { month, year, status: "OPEN", unlockedUsers: [] };
}

async function closePeriod(month: number, year: number, currentUser: any) {
  if (!month || !year) {
    throw new AppError(400, "Se requieren month y year");
  }

  const period = await Period.findOneAndUpdate(
    { month, year },
    {
      $set: {
        status: "CLOSED",
        closedAt: new Date(),
        closedBy: currentUser ? new mongoose.Types.ObjectId(currentUser.id) : undefined,
      },
      $setOnInsert: { unlockedUsers: [] },
    },
    { upsert: true, new: true }
  );

  if (currentUser) {
    await auditService.logAction(
      "CIERRE_MES",
      "Períodos",
      currentUser,
      `Período ${month}/${year} cerrado`,
      { period_id: period._id },
      period._id.toString()
    );
  }

  return period;
}

async function addException(periodId: string, userId: string, currentUser: any) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError(400, "userId inválido");
  }

  const period = await Period.findByIdAndUpdate(
    periodId,
    { $addToSet: { unlockedUsers: new mongoose.Types.ObjectId(userId) } },
    { new: true }
  );

  if (!period) throw new AppError(404, "Período no encontrado");
  if (period.status !== "CLOSED") {
    throw new AppError(400, "Solo se pueden agregar excepciones en períodos cerrados");
  }

  // Invalidar snapshot previo del usuario para forzar recálculo
  await ReportSnapshot.deleteOne({
    user_id: new mongoose.Types.ObjectId(userId),
    period_id: period._id,
  });

  if (currentUser) {
    await auditService.logAction(
      "EXCEPCION_CREADA",
      "Períodos",
      currentUser,
      `Excepción de escritura otorgada al usuario ${userId} en período ${period.month}/${period.year}`,
      { period_id: period._id, user_id: userId },
      period._id.toString()
    );
  }

  return period;
}

async function removeException(periodId: string, userId: string, currentUser: any) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError(400, "userId inválido");
  }

  const period = await Period.findByIdAndUpdate(
    periodId,
    { $pull: { unlockedUsers: new mongoose.Types.ObjectId(userId) } },
    { new: true }
  );

  if (!period) throw new AppError(404, "Período no encontrado");

  if (currentUser) {
    await auditService.logAction(
      "EXCEPCION_REVOCADA",
      "Períodos",
      currentUser,
      `Excepción revocada para usuario ${userId} en período ${period.month}/${period.year}`,
      { period_id: period._id, user_id: userId },
      period._id.toString()
    );
  }

  return period;
}

export default {
  getPeriod,
  closePeriod,
  addException,
  removeException,
};

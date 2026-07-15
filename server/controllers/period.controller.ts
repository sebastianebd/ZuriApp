import { Response } from "express";
import mongoose from "mongoose";
import Period from "../models/period.model";
import ReportSnapshot from "../models/report-snapshot.model";
import auditService from "../services/audit.service";
import { AuthRequest } from "../middleware/authentication.middleware";

/**
 * GET /periods?month=&year=
 * Devuelve el período del mes solicitado (o el actual si no se especifica).
 * Si no existe, lo considera OPEN implícitamente.
 */
export const getPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();

    const period = await Period.findOne({ month, year });
    // Si no existe el documento, el período es OPEN por defecto
    res.json(
      period ?? { month, year, status: "OPEN", unlockedUsers: [] },
    );
  } catch (error) {
    res.status(500).json({ message: "Error al obtener período", error });
  }
};

/**
 * PUT /periods/close
 * Cierra globalmente el período. Costo O(1) — no calcula nada.
 */
export const closePeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ message: "Se requieren month y year" });
    }

    const period = await Period.findOneAndUpdate(
      { month, year },
      {
        $set: {
          status: "CLOSED",
          closedAt: new Date(),
          closedBy: req.user?._id,
        },
        $setOnInsert: { unlockedUsers: [] },
      },
      { upsert: true, new: true },
    );

    await auditService.logAction(
      "CIERRE_MES",
      "Períodos",
      req.user,
      `Período ${month}/${year} cerrado`,
      { period_id: period._id },
      period._id.toString(),
    );

    res.json(period);
  } catch (error) {
    res.status(500).json({ message: "Error al cerrar período", error });
  }
};

/**
 * POST /periods/:id/exceptions
 * Agrega un usuario a la lista de excepciones (unlockedUsers).
 * Usa $addToSet para evitar duplicados y race conditions.
 * Invalida el snapshot previo del usuario si existía.
 */
export const addException = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "userId inválido" });
    }

    const period = await Period.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { unlockedUsers: new mongoose.Types.ObjectId(userId) } },
      { new: true },
    );

    if (!period) return res.status(404).json({ message: "Período no encontrado" });
    if (period.status !== "CLOSED") {
      return res.status(400).json({ message: "Solo se pueden agregar excepciones en períodos cerrados" });
    }

    // Invalidar snapshot previo del usuario para forzar recálculo
    await ReportSnapshot.deleteOne({
      user_id: new mongoose.Types.ObjectId(userId),
      period_id: period._id,
    });

    await auditService.logAction(
      "EXCEPCION_CREADA",
      "Períodos",
      req.user,
      `Excepción de escritura otorgada al usuario ${userId} en período ${period.month}/${period.year}`,
      { period_id: period._id, user_id: userId },
      period._id.toString(),
    );

    res.json(period);
  } catch (error) {
    res.status(500).json({ message: "Error al agregar excepción", error });
  }
};

/**
 * DELETE /periods/:id/exceptions/:userId
 * Revoca la excepción de un usuario (lo sella nuevamente).
 * Usa $pull para operación atómica.
 */
export const removeException = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "userId inválido" });
    }

    const period = await Period.findByIdAndUpdate(
      req.params.id,
      { $pull: { unlockedUsers: new mongoose.Types.ObjectId(userId) } },
      { new: true },
    );

    if (!period) return res.status(404).json({ message: "Período no encontrado" });

    await auditService.logAction(
      "EXCEPCION_REVOCADA",
      "Períodos",
      req.user,
      `Excepción revocada para usuario ${userId} en período ${period.month}/${period.year}`,
      { period_id: period._id, user_id: userId },
      period._id.toString(),
    );

    res.json(period);
  } catch (error) {
    res.status(500).json({ message: "Error al revocar excepción", error });
  }
};

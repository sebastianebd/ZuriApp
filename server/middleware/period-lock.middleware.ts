import mongoose from "mongoose";
import Period from "../models/period.model";
import { Response } from "express";
import { AuthRequest } from "./authentication.middleware";

/**
 * Verifica si una operación de escritura está permitida para el mes/año dado.
 *
 * Reglas:
 * - Si el período está OPEN → permitido siempre.
 * - Si el período está CLOSED → 403.
 * - Si no existe el documento de período → se considera OPEN (comportamiento por defecto).
 *
 * @returns true si se debe continuar, false si ya respondió con 403.
 */
export async function checkPeriodLock(
  req: AuthRequest,
  res: Response,
  month: number,
  year: number,
  staffId: string,
): Promise<boolean> {
  const period = await Period.findOne({ month, year });
  if (!period || period.status === "OPEN") return true;

  res.status(403).json({
    message: `El período ${month}/${year} está cerrado. Solicite una excepción al administrador.`,
    code: "PERIOD_LOCKED",
  });
  return false;
}

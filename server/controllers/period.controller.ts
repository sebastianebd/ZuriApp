import { Response } from "express";
import { AuthRequest } from "../middleware/authentication.middleware";
import periodService from "../services/period.service";

/**
 * GET /periods?month=&year=
 * Devuelve el período del mes solicitado (o el actual si no se especifica).
 * Si no existe, lo considera OPEN implícitamente.
 */
export const getPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();
    const period = await periodService.getPeriod(month, year);
    res.json(period);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al obtener período", error });
  }
};

/**
 * PUT /periods/close
 * Cierra globalmente el período. Costo O(1) — no calcula nada.
 */
export const closePeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.body;
    const period = await periodService.closePeriod(month, year, req.account);
    res.json(period);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al cerrar período", error });
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
    const period = await periodService.addException(req.params.id, userId, req.account);
    res.json(period);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al agregar excepción", error });
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
    const period = await periodService.removeException(req.params.id, userId, req.account);
    res.json(period);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al revocar excepción", error });
  }
};


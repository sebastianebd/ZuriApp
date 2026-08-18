import { Request, Response } from "express";
import turnSiglaService from "../services/turn-sigla.service";
import { turnSiglaSchema } from "../schemas/turn-sigla.schema";
import { AuthRequest } from "../middleware/authentication.middleware";

export const getTurnSiglas = async (req: Request, res: Response) => {
  try {
    const all = req.query.all === "true";
    const siglas = await turnSiglaService.getTurnSiglas(all);
    res.json(siglas);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al obtener siglas", error });
  }
};

export const createTurnSigla = async (req: AuthRequest, res: Response) => {
  try {
    const validation = turnSiglaSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return res.status(400).json({ 
        message: `Error de validación (${firstError.path.join('.')}): ${firstError.message}`, 
        errors: validation.error.format() 
      });
    }

    const newSigla = await turnSiglaService.createTurnSigla(validation.data, req.account!);
    res.status(201).json(newSigla);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al crear sigla", error });
  }
};

export const updateTurnSigla = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const schema = turnSiglaSchema.partial();
    const validation = schema.safeParse(req.body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return res.status(400).json({ 
        message: `Error de validación (${firstError.path.join('.')}): ${firstError.message}`, 
        errors: validation.error.format() 
      });
    }

    const updated = await turnSiglaService.updateTurnSigla(id, validation.data, req.account!);
    res.json(updated);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al actualizar sigla", error });
  }
};

export const deleteTurnSigla = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await turnSiglaService.deleteTurnSigla(id, req.account!);
    res.json({ message: "Sigla eliminada correctamente", deleted });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al eliminar sigla", error });
  }
};


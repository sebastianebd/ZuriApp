import { Request, Response } from "express";
import { z } from "zod";
import turnTypeService from "../services/turn-type.service";
import { turnTypeSchema } from "../schemas/turn-type.schema";
import { AuthRequest } from "../middleware/authentication.middleware";

export const getTurnTypes = async (req: Request, res: Response) => {
  try {
    const all = req.query.all === "true";
    const turnTypes = await turnTypeService.getTurnTypes(all);
    res.json(turnTypes);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al obtener tipos de turno", error });
  }
};

export const createTurnType = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = turnTypeSchema.parse(req.body);
    const turnType = await turnTypeService.createTurnType(validatedData, req.account!);
    res.status(201).json(turnType);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0].message });
    }
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al crear tipo de turno", error });
  }
};

export const updateTurnType = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = turnTypeSchema.parse(req.body);
    const turnType = await turnTypeService.updateTurnType(id, validatedData, req.account!);
    res.json(turnType);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0].message });
    }
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al actualizar tipo de turno", error });
  }
};

export const deleteTurnType = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const turnType = await turnTypeService.deleteTurnType(id, req.account!);
    res.json({ message: "Tipo de turno desactivado correctamente", turnType });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al eliminar tipo de turno", error });
  }
};


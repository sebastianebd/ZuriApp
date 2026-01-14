import { Request, Response } from "express";
import TurnType from "../models/turn-type.model";
import { z } from "zod";

const turnTypeSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").trim(),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
});

export const getTurnTypes = async (req: Request, res: Response) => {
  try {
    const filter = req.query.all === "true" ? {} : { activo: true };
    const turnTypes = await TurnType.find(filter).sort({ nombre: 1 });
    res.json(turnTypes);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener tipos de turno", error });
  }
};

export const createTurnType = async (req: Request, res: Response) => {
  try {
    const validatedData = turnTypeSchema.parse(req.body);
    const existing = await TurnType.findOne({
      nombre: { $regex: new RegExp(`^${validatedData.nombre}$`, "i") },
    });

    if (existing) {
      return res.status(409).json({ message: "El tipo de turno ya existe" });
    }

    const turnType = await TurnType.create(validatedData);
    res.status(201).json(turnType);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: "Error al crear tipo de turno", error });
  }
};

export const updateTurnType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = turnTypeSchema.parse(req.body);

    const existing = await TurnType.findOne({
      nombre: { $regex: new RegExp(`^${validatedData.nombre}$`, "i") },
      _id: { $ne: id },
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Ya existe un tipo de turno con este nombre" });
    }

    const turnType = await TurnType.findByIdAndUpdate(id, validatedData, {
      new: true,
    });

    if (!turnType) {
      return res.status(404).json({ message: "Tipo de turno no encontrado" });
    }

    res.json(turnType);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res
      .status(500)
      .json({ message: "Error al actualizar tipo de turno", error });
  }
};

export const deleteTurnType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const turnType = await TurnType.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!turnType) {
      return res.status(404).json({ message: "Tipo de turno no encontrado" });
    }

    res.json({ message: "Tipo de turno desactivado correctamente", turnType });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar tipo de turno", error });
  }
};

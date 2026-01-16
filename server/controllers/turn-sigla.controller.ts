import { Request, Response } from "express";
import { TurnSigla } from "../models/turn-sigla.model";
import { z } from "zod";

// Zod Schema
const turnSiglaSchema = z.object({
  sigla: z
    .string()
    .min(1)
    .max(5)
    .transform((val) => val.toUpperCase()),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Color inválido"),
  turno_entrada: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .nullable(),
  turno_salida: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .nullable(),
  activo: z.boolean().default(true),
});

export const getTurnSiglas = async (req: Request, res: Response) => {
  try {
    const siglas = await TurnSigla.find({ activo: true }).sort({ sigla: 1 }); // Alphabetical or custom order?
    res.json(siglas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener siglas", error });
  }
};

export const createTurnSigla = async (req: Request, res: Response) => {
  try {
    const validation = turnSiglaSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { sigla } = validation.data;
    const existing = await TurnSigla.findOne({ sigla });
    if (existing) {
      return res.status(400).json({ message: "La sigla ya existe" });
    }

    const newSigla = new TurnSigla(validation.data);
    await newSigla.save();
    res.status(201).json(newSigla);
  } catch (error) {
    res.status(500).json({ message: "Error al crear sigla", error });
  }
};

export const updateTurnSigla = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Allow partial updates
    const schema = turnSiglaSchema.partial();
    const validation = schema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const updated = await TurnSigla.findByIdAndUpdate(id, validation.data, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Sigla no encontrada" });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar sigla", error });
  }
};

export const deleteTurnSigla = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Soft delete
    const deleted = await TurnSigla.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );
    if (!deleted)
      return res.status(404).json({ message: "Sigla no encontrada" });

    res.json({ message: "Sigla eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar sigla", error });
  }
};

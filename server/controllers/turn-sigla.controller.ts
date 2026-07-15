import { Request, Response } from "express";
import { TurnSigla } from "../models/turn-sigla.model";
import { z } from "zod";

import AuditService from "../services/audit.service";

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
    const filter: any = req.query.all === "true" ? {} : { activo: true };
    filter.deleted_at = null;
    const siglas = await TurnSigla.find(filter).sort({ sigla: 1 });
    res.json(siglas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener siglas", error });
  }
};

export const createTurnSigla = async (req: Request, res: Response) => {
  try {
    const validation = turnSiglaSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return res.status(400).json({ 
        message: `Error de validación (${firstError.path.join('.')}): ${firstError.message}`, 
        errors: validation.error.format() 
      });
    }

    const { sigla } = validation.data;
    const existing = await TurnSigla.findOne({ sigla, deleted_at: null });
    if (existing) {
      return res.status(400).json({ message: "La sigla ya existe" });
    }

    const newSigla = new TurnSigla(validation.data);
    await newSigla.save();

    if ((req as any).user) {
      const times =
        newSigla.turno_entrada && newSigla.turno_salida
          ? ` ${newSigla.turno_entrada} - ${newSigla.turno_salida}`
          : "";
      await AuditService.logAction(
        "CREAR",
        "Tipos Turno",
        (req as any).user,
        `Creó la sigla: ${newSigla.sigla} - ${newSigla.nombre}${times}`,
        newSigla,
        newSigla._id.toString(),
      );
    }

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
      const firstError = validation.error.issues[0];
      return res.status(400).json({ 
        message: `Error de validación (${firstError.path.join('.')}): ${firstError.message}`, 
        errors: validation.error.format() 
      });
    }

    const existing = await TurnSigla.findById(id);

    const updated = await TurnSigla.findByIdAndUpdate(id, validation.data, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Sigla no encontrada" });

    if ((req as any).user) {
      // Generación automática de Diff usando el servicio de auditoría
      // Comparar estado 'existing' (pre-update) vs 'updated' (post-update)
      const diff = AuditService.generateDiff(
        (existing as any)?.toObject(),
        updated.toObject(),
      );

      // Solo registramos auditoría si hubo cambios reales
      if (diff) {
        const description = `Modificó la sigla: ${updated.sigla}. Cambios: [${diff}]`;

        await AuditService.logAction(
          "MODIFICAR",
          "Tipos Turno",
          (req as any).user,
          description,
          { old: existing, new: validation.data, diff },
          updated._id.toString(),
        );
      }
    }

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
      { activo: false, deleted_at: new Date() },
      { new: true },
    );
    if (!deleted)
      return res.status(404).json({ message: "Sigla no encontrada" });

    if ((req as any).user) {
      await AuditService.logAction(
        "ELIMINAR",
        "Tipos Turno",
        (req as any).user,
        `Se eliminó la sigla: ${deleted.sigla} - ${deleted.nombre}`,
        null,
        deleted._id.toString(),
      );
    }

    res.json({ message: "Sigla eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar sigla", error });
  }
};

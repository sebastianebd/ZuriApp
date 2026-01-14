import { Request, Response } from "express";
import TurnType from "../models/turn-type.model";
import AuditService from "../services/audit.service";
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

    // SKU Generation Logic
    const words = validatedData.nombre.trim().split(/\s+/);
    let prefix = "";
    if (words.length === 1) {
      prefix = words[0].substring(0, 3).toUpperCase();
    } else {
      // 1st letter of 1st word + 2 letters of 2nd word
      const first = words[0].substring(0, 1);
      const second = words[1].substring(0, 2);
      prefix = (first + second).toUpperCase();
    }

    // Determine sequence (Global)
    const allTurnTypes = await TurnType.find({
      codigo: { $exists: true, $ne: null },
    }).select("codigo");

    let maxSeq = 0;
    allTurnTypes.forEach((t) => {
      if (t.codigo && t.codigo.includes("-")) {
        const parts = t.codigo.split("-");
        if (parts.length === 2) {
          const num = parseInt(parts[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    });

    const sequence = maxSeq + 1;
    const codigo = `${prefix}-${sequence.toString().padStart(3, "0")}`;

    const turnType = await TurnType.create({ ...validatedData, codigo });

    if ((req as any).user) {
      await AuditService.logAction(
        "CREAR",
        "TIPOS_TURNO",
        (req as any).user,
        `Creó el tipo de turno: ${turnType.nombre} (${turnType.codigo})`,
        turnType,
        turnType._id.toString()
      );
    }

    res.status(201).json(turnType);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: (error as z.ZodError).issues[0].message });
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

    if (turnType && (req as any).user) {
      await AuditService.logAction(
        "ACTUALIZAR",
        "TIPOS_TURNO",
        (req as any).user,
        `Actualizó el tipo de turno: ${turnType.nombre}`,
        { old: existing, new: validatedData },
        turnType._id.toString()
      );
    }

    if (!turnType) {
      return res.status(404).json({ message: "Tipo de turno no encontrado" });
    }

    res.json(turnType);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: (error as z.ZodError).issues[0].message });
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

    if (turnType && (req as any).user) {
      await AuditService.logAction(
        "ELIMINAR",
        "TIPOS_TURNO",
        (req as any).user,
        `Desactivó el tipo de turno: ${turnType.nombre}`,
        null,
        turnType._id.toString()
      );
    }

    if (!turnType) {
      return res.status(404).json({ message: "Tipo de turno no encontrado" });
    }

    res.json({ message: "Tipo de turno desactivado correctamente", turnType });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar tipo de turno", error });
  }
};

import { Request, Response } from "express";
import TurnType from "../models/turn-type.model";
import AuditService from "../services/audit.service";
import { z } from "zod";

const turnTypeSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").trim(),
  descripcion: z.string().optional(),
  alias: z.string().optional(),
  jornada: z.enum(["DIURNO", "NOCTURNO", "MIXTO"]).optional(),
  cantidad_dias: z.number().min(1, "Debe tener al menos 1 día"),
  secuencia: z
    .array(
      z.object({
        dia: z.number(),
        turno_entrada: z.string().nullable().optional(),
        turno_salida: z.string().nullable().optional(),
        es_libre: z.boolean(),
        sigla: z.string().min(1, "La sigla es requerida"),
        color: z
          .string()
          .regex(/^#([0-9A-F]{3}){1,2}$/i)
          .optional(),
      }),
    )
    .min(1, "La secuencia es requerida"),
  activo: z.boolean().optional(),
});

export const getTurnTypes = async (req: Request, res: Response) => {
  try {
    const filter: any = req.query.all === "true" ? {} : { activo: true };
    filter.deleted_at = null;
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
      deleted_at: null,
    });

    if (existing) {
      return res.status(409).json({ message: "El tipo de turno ya existe" });
    }

    // Generación de SKU (Código de Referencia)
    // Lógica inteligente basada en el nombre para generar códigos memorables (ej: "Largo" -> "LAR", "Cuarto Turno" -> "CTU")
    const words = validatedData.nombre.trim().split(/\s+/);
    let prefix = "";
    if (words.length === 1) {
      prefix = words[0].substring(0, 3).toUpperCase();
    } else {
      // 1ra letra de la 1ra palabra + 2 letras de la 2da palabra (Heurística estándar)
      const first = words[0].substring(0, 1);
      const second = words[1].substring(0, 2);
      prefix = (first + second).toUpperCase();
    }

    // Control de Secuencia Global
    // Consulta optimizada para buscar el último correlativo usado en el formato PREFIX-NNN
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
        "Tipos de Turno",
        (req as any).user,
        `Creó el tipo de turno: ${turnType.nombre} (${turnType.codigo})`,
        turnType,
        turnType._id.toString(),
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
      deleted_at: null,
      _id: { $ne: id },
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Ya existe un tipo de turno con este nombre" });
    }

    const oldTurnType = await TurnType.findById(id);

    const turnType = await TurnType.findByIdAndUpdate(id, validatedData, {
      new: true,
    });

    if (turnType && (req as any).user) {
      const diff = AuditService.generateDiff(
        oldTurnType?.toObject(),
        turnType.toObject(),
      );

      if (diff) {
        const description = `Modificó el tipo de turno: ${turnType.nombre} (${turnType.codigo}). Cambios: [${diff}]`;

        await AuditService.logAction(
          "MODIFICAR",
          "Tipos de Turno",
          (req as any).user,
          description,
          { old: oldTurnType, new: validatedData, diff },
          turnType._id.toString(),
        );
      }
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
      { activo: false, deleted_at: new Date() },
      { new: true },
    );

    if (turnType && (req as any).user) {
      await AuditService.logAction(
        "ELIMINAR",
        "Tipos de Turno",
        (req as any).user,
        `Se eliminó el turno: ${turnType.nombre} (${turnType.codigo})`,
        null,
        turnType._id.toString(),
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

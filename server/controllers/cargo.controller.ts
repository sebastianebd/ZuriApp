import { Request, Response } from "express";
import Cargo from "../models/cargo.model";

// GET /api/cargos?activo=true
export const getCargos = async (req: Request, res: Response) => {
  try {
    const { activo } = req.query;
    const filter: any = {};
    if (activo !== undefined) {
      filter.activo = activo === "true";
    }

    const cargos = await Cargo.find(filter).sort({ nombre: 1 });
    res.json(cargos);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo cargos", error });
  }
};

// POST /api/cargos
export const createCargo = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, nivel, permisos } = req.body; // nivel, permisos added

    // Check duplicity by name
    const existing = await Cargo.findOne({ nombre: nombre?.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "El cargo ya existe" });
    }

    // Smart SKU Generation (Global Sequence)
    let codigo = req.body.codigo;

    if (!codigo && nombre) {
      const prefix = nombre.substring(0, 3).toUpperCase();

      // Fetch all codes to find the highest global sequence number
      const allCargos = await Cargo.find({
        codigo: { $exists: true, $ne: null },
      }).select("codigo");

      let maxSeq = 0;
      allCargos.forEach((c) => {
        if (c.codigo && c.codigo.includes("-")) {
          const parts = c.codigo.split("-");
          if (parts.length === 2) {
            const num = parseInt(parts[1], 10);
            if (!isNaN(num) && num > maxSeq) {
              maxSeq = num;
            }
          }
        }
      });

      const sequence = maxSeq + 1;
      codigo = `${prefix}-${sequence.toString().padStart(3, "0")}`;
    }

    const payload: any = {
      nombre,
      descripcion,
      codigo,
      nivel: nivel || 10,
      permisos: permisos || [],
    };

    const cargo = new Cargo(payload);
    await cargo.save();
    res.status(201).json(cargo);
  } catch (error) {
    res.status(400).json({ message: "Error creando cargo", error });
  }
};

// PUT /api/cargos/:id
export const updateCargo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo, nivel, permisos } = req.body;

    // Check unique name if changing name
    if (nombre) {
      const existing = await Cargo.findOne({
        nombre: nombre.toUpperCase(),
        _id: { $ne: id },
      });
      if (existing) {
        return res
          .status(400)
          .json({ message: "El nombre del cargo ya está en uso" });
      }
    }

    const cargo = await Cargo.findByIdAndUpdate(
      id,
      { nombre, descripcion, activo, nivel, permisos },
      { new: true, runValidators: true }
    );

    if (!cargo) return res.status(404).json({ message: "Cargo no encontrado" });

    res.json(cargo);
  } catch (error) {
    res.status(400).json({ message: "Error actualizando cargo", error });
  }
};

// DELETE /api/cargos/:id (Soft delete preferiblemente)
export const deleteCargo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if used by users? (Optional later)

    const cargo = await Cargo.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );
    if (!cargo) return res.status(404).json({ message: "Cargo no encontrado" });

    res.json({ message: "Cargo desactivado correctamente", cargo });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando cargo", error });
  }
};

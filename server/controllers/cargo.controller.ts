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
    const { nombre, descripcion } = req.body;

    // Check duplicity
    const existing = await Cargo.findOne({ nombre: nombre?.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "El cargo ya existe" });
    }

    const cargo = new Cargo({ nombre, descripcion });
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
    const { nombre, descripcion, activo } = req.body;

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
      { nombre, descripcion, activo },
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

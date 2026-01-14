import { Request, Response } from "express";
import Service from "../models/service.model";
import { z } from "zod";

const serviceSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").trim(),
  activo: z.boolean().optional(),
});

export const getServices = async (req: Request, res: Response) => {
  try {
    // Only return active services by default unless ?all=true is specified
    const filter = req.query.all === "true" ? {} : { activo: true };
    const services = await Service.find(filter).sort({ nombre: 1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener servicios", error });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const validatedData = serviceSchema.parse(req.body);
    const existing = await Service.findOne({
      nombre: { $regex: new RegExp(`^${validatedData.nombre}$`, "i") },
    });

    if (existing) {
      return res.status(409).json({ message: "El servicio ya existe" });
    }

    const service = await Service.create(validatedData);
    res.status(201).json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: "Error al crear servicio", error });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = serviceSchema.parse(req.body);

    const existing = await Service.findOne({
      nombre: { $regex: new RegExp(`^${validatedData.nombre}$`, "i") },
      _id: { $ne: id },
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Ya existe un servicio con este nombre" });
    }

    const service = await Service.findByIdAndUpdate(id, validatedData, {
      new: true,
    });

    if (!service) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    res.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: "Error al actualizar servicio", error });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const service = await Service.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    res.json({ message: "Servicio desactivado correctamente", service });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar servicio", error });
  }
};

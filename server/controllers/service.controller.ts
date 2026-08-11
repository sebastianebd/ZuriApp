import { Request, Response } from "express";
import { z } from "zod";
import serviceService from "../services/service.service";
import { serviceSchema } from "../schemas/service.schema";
import { AuthRequest } from "../middleware/authentication.middleware";

export const getServices = async (req: Request, res: Response) => {
  try {
    const services = await serviceService.getServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener servicios", error });
  }
};

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = serviceSchema.parse(req.body);
    const service = await serviceService.createService(validatedData, req.account!);
    res.status(201).json(service);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0].message });
    }
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al crear servicio", error });
  }
};

export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = serviceSchema.parse(req.body);
    const service = await serviceService.updateService(id, validatedData, req.account!);
    res.json(service);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0].message });
    }
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al actualizar servicio", error });
  }
};

export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const service = await serviceService.deleteService(id, req.account!);
    res.json({ message: "Servicio desactivado correctamente", service });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al eliminar servicio", error });
  }
};


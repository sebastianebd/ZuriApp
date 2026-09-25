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
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error al eliminar servicio", error });
  }
};

export const updateServiceStaffingHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const Service = (await import("../models/service.model")).default;
    const dashboardService = (await import("../services/dashboard.service")).default;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Servicio no encontrado",
      });
    }

    const staffId = req.staff?._id?.toString();
    const role = req.staff?.roleId;

    const isGlobalAdmin =
      role?.level === 100 || role?.permissions?.includes("service.update");
    const isChief =
      staffId &&
      (service.jefe_servicio?.toString() === staffId ||
        service.supervisor?.toString() === staffId ||
        service.coordinadores?.some((c: any) => c.toString() === staffId));

    if (!isGlobalAdmin && !isChief) {
      return res.status(403).json({
        success: false,
        message: "No tiene permisos para modificar la dotación de este servicio",
      });
    }

    const { dotacion_minima, umbrales_cobertura } = req.body;
    if (dotacion_minima !== undefined) {
      service.dotacion_minima = dotacion_minima;
    }
    if (umbrales_cobertura !== undefined) {
      service.umbrales_cobertura = umbrales_cobertura;
    }

    await service.save();

    // Invalidar caché en Redis y emitir WebSocket
    await dashboardService.invalidateDashboardCache(id);

    return res.status(200).json({
      success: true,
      message: "Dotación y umbrales actualizados exitosamente",
      data: service,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Error al actualizar dotación del servicio",
      error,
    });
  }
};



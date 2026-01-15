import { Request, Response } from "express";
import Service from "../models/service.model";
import AuditService from "../services/audit.service";
import { z } from "zod";

const serviceSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").trim(),
  jefe_servicio: z.string().optional().nullable(),
  supervisor: z.string().optional().nullable(),
  coordinadores: z.array(z.string()).optional(),
  jefes_turno: z.array(z.string()).optional(),
  centro_costo: z.string().optional().nullable(),
  ubicacion: z.string().optional().nullable(),
  anexo: z.string().optional().nullable(),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
  activo: z.boolean().optional(),
});

export const getServices = async (req: Request, res: Response) => {
  try {
    // Only return active services by default unless ?all=true is specified
    const filter = req.query.all === "true" ? {} : { activo: true };
    const services = await Service.find(filter)
      .populate("jefe_servicio", "nombre apellido rut email")
      .populate("supervisor", "nombre apellido rut email")
      .populate("coordinadores", "nombre apellido rut email")
      .populate("jefes_turno", "nombre apellido rut email")
      .sort({ nombre: 1 });
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
    const allServices = await Service.find({
      codigo: { $exists: true, $ne: null },
    }).select("codigo");

    let maxSeq = 0;
    allServices.forEach((s) => {
      if (s.codigo && s.codigo.includes("-")) {
        const parts = s.codigo.split("-");
        // Ensure we only look at the numeric part of the format XXX-NNN
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

    const service = await Service.create({ ...validatedData, codigo });

    if ((req as any).user) {
      await AuditService.logAction(
        "CREAR",
        "SERVICIOS",
        (req as any).user,
        `Creó el servicio: ${service.nombre} (${service.codigo})`,
        service,
        service._id.toString()
      );
    }

    res.status(201).json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: (error as z.ZodError).issues[0].message });
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

    // Audit Update
    if (service && (req as any).user) {
      await AuditService.logAction(
        "ACTUALIZAR",
        "SERVICIOS",
        (req as any).user,
        `Actualizó el servicio: ${service.nombre}`,
        { old: existing, new: validatedData },
        service._id.toString()
      );
    }

    if (!service) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    res.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: (error as z.ZodError).issues[0].message });
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

    if (service && (req as any).user) {
      await AuditService.logAction(
        "ELIMINAR",
        "SERVICIOS",
        (req as any).user,
        `Desactivó el servicio: ${service.nombre}`,
        null,
        service._id.toString()
      );
    }

    if (!service) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    res.json({ message: "Servicio desactivado correctamente", service });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar servicio", error });
  }
};

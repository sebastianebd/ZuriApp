import { Request, Response } from "express";
import Service from "../models/service.model";
import User from "../models/user.model";
import AuditService from "../services/audit.service";
import { z } from "zod";

const serviceSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").trim(),
  jefe_servicio: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  supervisor: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  coordinadores: z.array(z.string()).optional(),
  jefes_turno: z.array(z.string()).optional(),
  centro_costo: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  ubicacion: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  anexo: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v)),
  activo: z.boolean().optional(),
});

export const getServices = async (req: Request, res: Response) => {
  try {
    // Return all non-deleted services.
    // ?all=true is no longer needed for active/inactive since we want to see both in the table usually,
    // but filtered by 'eliminado'.
    // If we want to filter by Active status specifically, we can add query params, but standard view usually shows all non-deleted.
    const query = { deleted_at: null };

    const services = await Service.find(query)
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
      deleted_at: null, // Check against non-deleted only
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
      deleted_at: null,
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Ya existe un servicio con este nombre" });
    }

    // Fetch current with population to get Old Names
    const currentService = await Service.findById(id)
      .populate("jefe_servicio")
      .populate("supervisor")
      .populate("coordinadores")
      .populate("jefes_turno");

    if (!currentService) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    const service = await Service.findByIdAndUpdate(id, validatedData, {
      new: true,
    })
      .populate("jefe_servicio", "nombre apellido rut email")
      .populate("supervisor", "nombre apellido rut email")
      .populate("coordinadores", "nombre apellido rut email")
      .populate("jefes_turno", "nombre apellido rut email");

    // AUDIT LOGIC (Non-blocking)
    try {
      if (service && (req as any).user) {
        // Prepare diff string
        const changes: string[] = [];
        const fieldsToCheck = [
          "nombre",
          "jefe_servicio",
          "supervisor",
          "coordinadores",
          "jefes_turno",
          "centro_costo",
          "ubicacion",
          "anexo",
          "email",
          "activo",
        ];

        const getName = async (val: any): Promise<string> => {
          if (!val) return "Sin asignar";
          if (typeof val === "object" && val.nombre)
            return `${val.nombre} ${val.apellido}`;
          if (typeof val === "string" && val.match(/^[0-9a-fA-F]{24}$/)) {
            try {
              const u = await User.findById(val);
              return u ? `${u.nombre} ${u.apellido}` : val;
            } catch (e) {
              return String(val);
            }
          }
          return String(val);
        };

        // Check Fields
        for (const field of [
          "nombre",
          "centro_costo",
          "ubicacion",
          "anexo",
          "email",
          "activo",
        ]) {
          const oldVal = (currentService as any)[field];
          const newVal = (validatedData as any)[field];
          if (oldVal != newVal && newVal !== undefined) {
            const fmt = (v: any) =>
              typeof v === "boolean" ? (v ? "Sí" : "No") : v || "Vacio";
            changes.push(`${field}: ${fmt(oldVal)} -> ${fmt(newVal)}`);
          }
        }

        // Check Relations (Single)
        for (const field of ["jefe_servicio", "supervisor"]) {
          const oldObj = (currentService as any)[field];
          const oldId = oldObj && oldObj._id ? oldObj._id.toString() : null;
          const newId = (validatedData as any)[field] || null;

          if (oldId !== newId) {
            const oldName = await getName(oldObj);
            const newName = await getName(newId);
            changes.push(`${field}: ${oldName} -> ${newName}`);
          }
        }

        // Check Relations (Array)
        for (const field of ["coordinadores", "jefes_turno"]) {
          const oldList = ((currentService as any)[field] || []).map((u: any) =>
            u && u._id ? u._id.toString() : String(u)
          );
          const newList = (validatedData as any)[field] || [];

          const isSame =
            oldList.length === newList.length &&
            oldList.every((oid: string) => newList.includes(oid));

          if (!isSame) {
            const oldNames = ((currentService as any)[field] || [])
              .map((u: any) =>
                u && u.nombre ? `${u.nombre} ${u.apellido}` : "Desconocido"
              )
              .join(", ");

            const newNamesArr = [];
            for (const nid of newList) {
              newNamesArr.push(await getName(nid));
            }
            const newNames = newNamesArr.join(", ");

            const oldStr = oldNames || "Sin asignar";
            const newStr = newNames || "Sin asignar";

            changes.push(`${field}: ${oldStr} -> ${newStr}`);
          }
        }

        if (changes.length > 0) {
          const detailsStr = ` (Cambios: ${changes.join(", ")})`;

          // Ultra-safe sanitized old object
          // We can rely on toObject() usually if we are not crashing on it.
          // If previous crash was here, wrapping in try/catch saves us.
          // But let's use manual just in case toObject is indeed the culprit.
          const manualOld = {
            _id: currentService._id,
            nombre: currentService.nombre,
            // store raw IDs or simple strings to be safe
            jefe_servicio: (currentService.jefe_servicio as any)?._id,
            supervisor: (currentService.supervisor as any)?._id,
            coordinadores: (currentService.coordinadores || []).map((u: any) =>
              u && u._id ? u._id : u
            ),
            jefes_turno: (currentService.jefes_turno || []).map((u: any) =>
              u && u._id ? u._id : u
            ),
            centro_costo: currentService.centro_costo,
            ubicacion: currentService.ubicacion,
            anexo: currentService.anexo,
            email: currentService.email,
            activo: currentService.activo,
          };

          await AuditService.logAction(
            "MODIFICAR",
            "SERVICIOS",
            (req as any).user,
            `Modificó el servicio: ${service.nombre}${detailsStr}`,
            { old: manualOld, new: validatedData },
            service._id.toString()
          );
        }
      }
    } catch (auditError) {
      console.error("FATAL AUDIT ERROR (Swallowed):", auditError);
      // Do not fail the request
    }

    res.json(service);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: (error as z.ZodError).issues[0].message });
    }
    const message = error.message || "Error desconocido";
    res
      .status(500)
      .json({ message: `Error al actualizar servicio: ${message}`, error });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const service = await Service.findByIdAndUpdate(
      id,
      { deleted_at: new Date() }, // SOFT DELETE DATE
      { new: true }
    );

    if (service && (req as any).user) {
      await AuditService.logAction(
        "ELIMINAR",
        "SERVICIOS",
        (req as any).user,
        `Eliminó el Servicio ${service.nombre} (${service.codigo})`,
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

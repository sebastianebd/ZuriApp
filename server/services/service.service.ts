import Service from "../models/service.model";
import Staff from "../models/staff.model";
import auditService from "../services/audit.service";
import { AppError } from "../errors/app-error";
import { escapeRegex } from "../utils/regex";

/**
 * Servicio para gestionar los "Servicios Clínicos/Hospitalarios".
 * NO debe confundirse conceptualmente con la capa base de "Servicios (Business Logic)".
 */

async function getServices() {
  const query = { deleted_at: null };
  return await Service.find(query)
    .populate("jefe_servicio", "firstName lastName rut email")
    .populate("supervisor", "firstName lastName rut email")
    .populate("coordinadores", "firstName lastName rut email")
    .populate("jefes_turno", "firstName lastName rut email")
    .sort({ nombre: 1 });
}

async function createService(validatedData: any, currentUser: any) {
  const existing = await Service.findOne({
    nombre: { $regex: new RegExp(`^${escapeRegex(validatedData.nombre)}$`, "i") },
    deleted_at: null,
  });

  if (existing) {
    throw new AppError(409, "El servicio ya existe");
  }

  const words = validatedData.nombre.trim().split(/\s+/);
  let prefix = "";
  if (words.length === 1) {
    prefix = words[0].substring(0, 3).toUpperCase();
  } else {
    const first = words[0].substring(0, 1);
    const second = words[1].substring(0, 2);
    prefix = (first + second).toUpperCase();
  }

  const allServices = await Service.find({
    codigo: { $exists: true, $ne: null },
  }).select("codigo");

  let maxSeq = 0;
  allServices.forEach((s) => {
    if (s.codigo && s.codigo.includes("-")) {
      const parts = s.codigo.split("-");
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

  if (currentUser) {
    await auditService.logAction(
      "CREAR",
      "Servicios",
      currentUser,
      `Creó el servicio: ${service.nombre} (${service.codigo})`,
      service,
      service._id.toString()
    );
  }

  return service;
}

async function updateService(id: string, validatedData: any, currentUser: any) {
  const existing = await Service.findOne({
    nombre: { $regex: new RegExp(`^${escapeRegex(validatedData.nombre)}$`, "i") },
    _id: { $ne: id },
    deleted_at: null,
  });

  if (existing) {
    throw new AppError(409, "Ya existe un servicio con este nombre");
  }

  const currentService = await Service.findById(id)
    .populate("jefe_servicio")
    .populate("supervisor")
    .populate("coordinadores")
    .populate("jefes_turno");

  if (!currentService) {
    throw new AppError(404, "Servicio no encontrado");
  }

  const service = await Service.findByIdAndUpdate(id, validatedData, { new: true })
    .populate("jefe_servicio", "firstName lastName rut email")
    .populate("supervisor", "firstName lastName rut email")
    .populate("coordinadores", "firstName lastName rut email")
    .populate("jefes_turno", "firstName lastName rut email");

  try {
    if (service && currentUser) {
      const changes: string[] = [];

      const getName = async (val: any): Promise<string> => {
        if (!val) return "Sin asignar";
        if (typeof val === "object" && val.firstName) return `${val.firstName} ${val.lastName}`;
        if (typeof val === "string" && val.match(/^[0-9a-fA-F]{24}$/)) {
          try {
            const u = await Staff.findById(val);
            return u ? `${u.firstName} ${u.lastName}` : val;
          } catch (e) {
            return String(val);
          }
        }
        return String(val);
      };

      for (const field of ["nombre", "centro_costo", "ubicacion", "anexo", "email", "activo"]) {
        const oldVal = (currentService as any)[field];
        const newVal = (validatedData as any)[field];
        if (oldVal != newVal && newVal !== undefined) {
          const fmt = (v: any) => (typeof v === "boolean" ? (v ? "Sí" : "No") : v || "Vacio");
          changes.push(`${field}: ${fmt(oldVal)} -> ${fmt(newVal)}`);
        }
      }

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

      for (const field of ["coordinadores", "jefes_turno"]) {
        const oldList = ((currentService as any)[field] || []).map((u: any) =>
          u && u._id ? u._id.toString() : String(u)
        );
        const newList = (validatedData as any)[field] || [];
        const isSame = oldList.length === newList.length && oldList.every((oid: string) => newList.includes(oid));

        if (!isSame) {
          const oldNames = ((currentService as any)[field] || [])
            .map((u: any) => (u && u.firstName ? `${u.firstName} ${u.lastName}` : "Desconocido"))
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
        const manualOld = {
          _id: currentService._id,
          nombre: currentService.nombre,
          jefe_servicio: (currentService.jefe_servicio as any)?._id,
          supervisor: (currentService.supervisor as any)?._id,
          coordinadores: (currentService.coordinadores || []).map((u: any) => (u && u._id ? u._id : u)),
          jefes_turno: (currentService.jefes_turno || []).map((u: any) => (u && u._id ? u._id : u)),
          centro_costo: currentService.centro_costo,
          ubicacion: currentService.ubicacion,
          anexo: currentService.anexo,
          email: currentService.email,
          activo: currentService.activo,
        };

        await auditService.logAction(
          "MODIFICAR",
          "Servicios",
          currentUser,
          `Modificó el servicio: ${service.nombre}${detailsStr}`,
          { old: manualOld, new: validatedData },
          service._id.toString()
        );
      }
    }
  } catch (auditError) {
    // Fallback: No fallamos la request principal si falla la auditoría auxiliar
  }

  return service;
}

async function deleteService(id: string, currentUser: any) {
  const service = await Service.findByIdAndUpdate(
    id,
    { deleted_at: new Date() },
    { new: true }
  );

  if (!service) {
    throw new AppError(404, "Servicio no encontrado");
  }

  if (currentUser) {
    await auditService.logAction(
      "ELIMINAR",
      "Servicios",
      currentUser,
      `Eliminó el Servicio ${service.nombre} (${service.codigo})`,
      null,
      service._id.toString()
    );
  }

  return service;
}

export default {
  getServices,
  createService,
  updateService,
  deleteService,
};

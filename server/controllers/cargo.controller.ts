import { Request, Response } from "express";
import Cargo from "../models/cargo.model";
import socketConfig from "../config/socket";
import auditService from "../services/audit.service";
import { AuthRequest } from "../middleware/authentication.middleware";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../constants/audit.constants";

// GET /api/cargos?activo=true
export const getCargos = async (req: Request, res: Response) => {
  try {
    const { activo } = req.query;
    const filter: any = {};
    // Exclusión por defecto de soft-deleted
    filter.deleted_at = null;
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
    const { nombre, descripcion, nivel, permisos } = req.body;

    // Validación de Unicidad
    const existing = await Cargo.findOne({ nombre: nombre?.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "El cargo ya existe" });
    }

    // Generación Inteligente de SKU (Código de Cargo)
    // Se autogenera basado en prefijo del nombre + secuencia global.
    let codigo = req.body.codigo;

    if (!codigo && nombre) {
      const prefix = nombre.substring(0, 3).toUpperCase();

      // Buscamos el mayor número de secuencia existente
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

    // Auditoría de Creación
    const authReq = req as AuthRequest;
    if (authReq.user) {
      await auditService.logAction(
        AUDIT_ACTIONS.CREAR,
        AUDIT_MODULES.GESTION_CARGOS,
        authReq.user,
        `Se creó el cargo ${cargo.nombre} (Nivel ${cargo.nivel})`,
        payload,
        cargo._id.toString(),
      );
    }

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

    // Recuperamos original para diffing
    const original: any = await Cargo.findById(id);
    if (!original)
      return res.status(404).json({ message: "Cargo no encontrado" });

    // Validación de unicidad en cambio de nombre
    if (nombre && nombre.toUpperCase() !== original.nombre.toUpperCase()) {
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
      { new: true, runValidators: true },
    );

    // Auditoría Detallada de Cambios
    const authReq = req as AuthRequest;
    if (authReq.user && cargo) {
      // 1. Detección de activación/desactivación
      if (activo !== undefined && activo !== original.activo) {
        const actionDesc = activo ? "activó" : "desactivó";
        await auditService.logAction(
          AUDIT_ACTIONS.MODIFICAR,
          AUDIT_MODULES.GESTION_CARGOS,
          authReq.user,
          `Se ${actionDesc} el cargo ${original.nombre}`,
          { old_activo: original.activo, new_activo: activo },
          cargo._id.toString(),
        );
      } else {
        // 2. Modificación Estándar (evitando diff falso en array de permisos)
        const originalForDiff = original.toObject();
        const bodyForDiff = { ...req.body };
        delete originalForDiff.permisos;
        delete bodyForDiff.permisos;

        let diff =
          auditService.generateDiff(originalForDiff, bodyForDiff, "Cargo") || "";

        // Diff específico para permisos
        if (permisos) {
          const oldPerms: string[] = original.permisos || [];
          const newPerms: string[] = permisos;

          const added = newPerms.filter((p) => !oldPerms.includes(p));
          const removed = oldPerms.filter((p) => !newPerms.includes(p));

          if (added.length > 0 || removed.length > 0) {
            const readableChanges: string[] = [];

            // Helper: Traduce técnica 'users.create' a 'Crear Usuarios'
            const translatePerm = (p: string) => {
              const [module, action] = p.split(".");
              const moduleMap: any = {
                users: "Usuarios",
                cargos: "Cargos",
                shifts: "Turnos",
                replacement: "Reemplazos",
                audit: "Auditoría",
              };
              const modName = moduleMap[module] || module;

              if (action === "view" || action === "read") return modName;

              const actionMap: any = {
                create: "Crear",
                update: "Editar",
                delete: "Eliminar",
              };
              return `${actionMap[action] || action} ${modName}`;
            };

            added.forEach((p) => {
              const name = translatePerm(p);
              if (p.endsWith(".view") || p.endsWith(".read")) {
                readableChanges.push(`${name} -> Visible`);
              } else {
                readableChanges.push(`${name} -> Activado`);
              }
            });

            removed.forEach((p) => {
              const name = translatePerm(p);
              if (p.endsWith(".view") || p.endsWith(".read")) {
                readableChanges.push(`${name} -> Oculto`);
              } else {
                readableChanges.push(`${name} -> Desactivado`);
              }
            });

            const permDiff = `permisos: ${readableChanges.join(", ")}`;

            if (diff) {
              diff += `, ${permDiff}`;
            } else {
              diff = permDiff;
            }
          }
        }

        if (diff) {
          await auditService.logAction(
            AUDIT_ACTIONS.MODIFICAR,
            AUDIT_MODULES.GESTION_CARGOS,
            authReq.user,
            `Se modificó el cargo ${original.nombre} (Cambios: ${diff})`,
            { original: original.toObject(), new: cargo.toObject() },
            cargo._id.toString(),
          );
        }
      }
    }

    // Actualización en Tiempo Real
    // Emitimos evento para que clientes conectados refresquen sus permisos sin reload.
    try {
      const io = socketConfig.getIO();
      io.emit("cargo_updated", {
        cargoNombre: cargo!.nombre,
        action: "update",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Socket emission failed:", err);
    }

    res.json(cargo);
  } catch (error) {
    res.status(400).json({ message: "Error actualizando cargo", error });
  }
};

// DELETE /api/cargos/:id (Soft delete)
export const deleteCargo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const original = await Cargo.findById(id);
    if (!original)
      return res.status(404).json({ message: "Cargo no encontrado" });

    const cargo = await Cargo.findByIdAndUpdate(
      id,
      { deleted_at: new Date() }, // Soft Delete: Marcamos fecha sin borrar documento
      { new: true },
    );

    // Auditoría de Eliminación
    const authReq = req as AuthRequest;
    if (authReq.user) {
      await auditService.logAction(
        AUDIT_ACTIONS.ELIMINAR,
        AUDIT_MODULES.GESTION_CARGOS,
        authReq.user,
        `Se eliminó el cargo ${original.nombre}`,
        null,
        id,
      );
    }

    res.json({ message: "Cargo desactivado correctamente", cargo });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando cargo", error });
  }
};

import { Request, Response } from "express";
import { TurnAssignmentModel } from "../models/turn-assignment.model";
import auditService from "../services/audit.service";
import { AuthRequest } from "../middleware/authentication.middleware";
import socketService from "../services/socket.service";
import { checkPeriodLock } from "../middleware/period-lock.middleware";

import TurnType from "../models/turn-type.model"; // Ensure this import exists at top
import notificationService from "../services/notification.service";

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { user_id, turn_type, start_date, end_date } = req.body;

    // Verificación de Período Cerrado
    const date = new Date(start_date);
    const allowed = await checkPeriodLock(
      req as AuthRequest,
      res,
      date.getMonth() + 1,
      date.getFullYear(),
      user_id,
    );
    if (!allowed) return;

    // 1. Patrón Snapshot (Foto Estática)
    // Recuperamos la configuración del turno en el momento de la asignación.
    // Esto es crucial para que cambios futuros en el 'Tipo de Turno' (ej: cambiar colores o secuencia)
    // NO afecten retroactivamente a las asignaciones pasadas (Historial Inmutable).
    const turnTypeDoc = await TurnType.findOne({
      nombre: { $regex: new RegExp(`^${turn_type}$`, "i") },
      deleted_at: null,
    });

    if (!turnTypeDoc) {
      return res
        .status(404)
        .json({ message: "Tipo de turno no encontrado o eliminado" });
    }

    // 2. Validación de Traslapes (Overlap)
    // Regla: Un funcionario no puede tener dos turnos contradictorios en el mismo periodo.
    // Maneja lógica de rangos finitos e infinitos (fecha fin null).
    const newStart = new Date(start_date);
    // Si end_date es null, asumimos futuro indefinido (Año 9999).
    const newEnd = end_date ? new Date(end_date) : new Date(9999, 11, 31);

    const overlapQuery: any = {
      user_id: user_id,
      $or: [
        {
          // Caso 1: Asignación existente cerrada (fecha fin definida) -> Verificamos intersección simple
          start_date: { $lte: newEnd },
          end_date: { $ne: null, $gte: newStart },
        },
        {
          // Caso 2: Asignación existente abierta (fecha fin null/indefinida)
          end_date: null,
          start_date: { $lte: newEnd }, // Solo importa que empiece antes de que termine la nueva
        },
      ],
    };

    const existingOverlap = await TurnAssignmentModel.findOne(overlapQuery);

    if (existingOverlap) {
      return res.status(409).json({
        message:
          "El funcionario ya tiene un turno asignado que se traslapa con estas fechas.",
        overlapId: existingOverlap._id,
      });
    }

    // 3. Persistencia con Snapshot
    const assignmentPayload = {
      ...req.body,
      turn_type: turnTypeDoc._id, // Referencia vinculada
      // Copia profunda de la secuencia para inmunidad histórica
      // (Excluimos el color para permitir ciertos updates visuales si se deseara, aunque aquí se guarda la estructura)
      snapshot_secuencia: turnTypeDoc.toObject().secuencia.map((item: any) => {
        const { color, ...rest } = item;
        return rest;
      }),
    };

    const assignment = await TurnAssignmentModel.create(assignmentPayload);
    await assignment.populate("user_id", "nombre apellido rut dv");

    const authReq = req as AuthRequest;
    if (authReq.user) {
      const targetUser = assignment.user_id as any;
      await auditService.logAction(
        "CREAR",
        "Turnos Actuales",
        authReq.user,
        `Asignación de turno creada para ${targetUser.nombre} ${targetUser.apellido} (${turn_type})`,
        {
          assignment_id: assignment._id,
          target_user_id: targetUser._id,
          turn_type: assignment.turn_type,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
        },
        assignment._id.toString(),
      );
    }

    // 4. Notificaciones Asíncronas (WhatsApp)
    // No bloqueamos la respuesta HTTP si el servicio de mensajería falla o demora.
    notificationService
      .notifyShiftAssignment({
        ...assignment.toObject(),
        user_id: assignment.user_id, // Populated
        turn_type_name: turnTypeDoc.nombre, // Inject name for readability
      })
      .catch((err) =>
        console.error("Error sending WhatsApp notification:", err),
      );

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: "Error creating assignment", error });
  }
};

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const filters: any = {};
    if (req.query.user_id) filters.user_id = req.query.user_id;
    if (req.query.service) filters.service = req.query.service;

    // Support filtering by date range (optional, for grid optimization later)
    if (req.query.month && req.query.year) {
      const year = parseInt(req.query.year as string);
      const month = parseInt(req.query.month as string); // 0-11 or 1-12? usually 1-12 from client
      // ... logic to be added if needed, sticking to basic filters for now
    }

    const assignments = await TurnAssignmentModel.find(filters)
      .populate("user_id", "nombre apellido rut dv servicio tipo_cargo")
      .sort({ start_date: 1 }); // Sort by start date makes more sense for history
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assignments", error });
  }
};

export const getAssignmentById = async (req: Request, res: Response) => {
  try {
    const assignment = await TurnAssignmentModel.findById(
      req.params.id,
    ).populate("user_id");
    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assignment", error });
  }
};

export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await TurnAssignmentModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      },
    ).populate("user_id");
    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: "Error updating assignment", error });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await TurnAssignmentModel.findByIdAndDelete(
      req.params.id,
    );
    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });
    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting assignment", error });
  }
};

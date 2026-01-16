import { Request, Response } from "express";
import { TurnAssignmentModel } from "../models/turn-assignment.model";
import auditService from "../services/audit.service";
import { AuthRequest } from "../middleware/authentication.middleware";

import TurnType from "../models/turn-type.model"; // Ensure this import exists at top

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { user_id, turn_type, start_date, end_date } = req.body;

    // 1. Snapshot Logic: Fetch current Turn Pattern
    // Use regex for case-insensitive match just in case, similar to other controllers
    const turnTypeDoc = await TurnType.findOne({
      nombre: { $regex: new RegExp(`^${turn_type}$`, "i") },
      deleted_at: null,
    });

    if (!turnTypeDoc) {
      return res
        .status(404)
        .json({ message: "Tipo de turno no encontrado o eliminado" });
    }

    // 2. Overlap Validation
    // Check if user has any assignment that overlaps with the new range
    const newStart = new Date(start_date);
    // If end_date is null, treat as indefinitely far future (e.g., year 9999)
    const newEnd = end_date ? new Date(end_date) : new Date(9999, 11, 31);

    const overlapQuery: any = {
      user_id: user_id,
      // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
      // Where A is existing, B is new.
      // But since we can have infinite end dates, we need to handle that carefully.
      $or: [
        {
          // Case 1: Existing assignment also has finite end date
          start_date: { $lte: newEnd },
          end_date: { $ne: null, $gte: newStart },
        },
        {
          // Case 2: Existing assignment is indefinite (end_date is null)
          end_date: null,
          start_date: { $lte: newEnd }, // Only start matters, it goes forever
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

    // 3. Create with Snapshot
    const assignmentPayload = {
      ...req.body,
      snapshot_secuencia: turnTypeDoc.secuencia, // IMMUTABLE HISTORY
    };

    const assignment = await TurnAssignmentModel.create(assignmentPayload);
    await assignment.populate("user_id", "nombre apellido rut dv");

    const authReq = req as AuthRequest;
    if (authReq.user) {
      const targetUser = assignment.user_id as any;
      await auditService.logAction(
        "CREAR",
        "TURNOS",
        authReq.user,
        `Asignación de turno creada para ${targetUser.nombre} ${targetUser.apellido} (${turn_type})`,
        {
          assignment_id: assignment._id,
          target_user_id: targetUser._id,
          turn_type: assignment.turn_type,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
        },
        assignment._id.toString()
      );
    }

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
      req.params.id
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
      }
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
      req.params.id
    );
    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });
    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting assignment", error });
  }
};

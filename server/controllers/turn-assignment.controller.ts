import { Request, Response } from "express";
import { TurnAssignmentModel } from "../models/turn-assignment.model";
import auditService from "../services/audit.service";
import { AuthRequest } from "../middleware/authentication.middleware";

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await TurnAssignmentModel.create(req.body);
    await assignment.populate("user_id", "nombre apellido rut dv");

    const authReq = req as AuthRequest;
    if (authReq.user) {
      const targetUser = assignment.user_id as any;
      await auditService.logAction(
        "CREAR",
        "TURNOS",
        authReq.user,
        `Asignación de turno creada para ${targetUser.nombre} ${targetUser.apellido}`,
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
    const assignments = await TurnAssignmentModel.find()
      .populate("user_id", "nombre apellido rut dv servicio tipo_cargo")
      .sort({ createdAt: -1 });
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

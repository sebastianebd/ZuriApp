import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authentication.middleware";
import { checkPeriodLock } from "../middleware/period-lock.middleware";
import turnAssignmentService from "../services/turn-assignment.service";

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { staffId, start_date } = req.body;
    const date = new Date(start_date);
    
    // Verificación de Período Cerrado
    const allowed = await checkPeriodLock(
      req as AuthRequest,
      res,
      date.getMonth() + 1,
      date.getFullYear(),
      staffId
    );
    if (!allowed) return;

    const assignment = await turnAssignmentService.createAssignment(req.body, (req as any).account);
    res.json(assignment);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const errorResponse: any = { message: error.message || "Error creating assignment", error };
    if (error.context && error.context.overlapId) {
      errorResponse.overlapId = error.context.overlapId;
    }
    res.status(statusCode).json(errorResponse);
  }
};

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const filters: any = {};
    if (req.query.staffId) filters.staffId = req.query.staffId;
    if (req.query.service) filters.service = req.query.service;

    const assignments = await turnAssignmentService.getAssignments(filters);
    res.json(assignments);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error fetching assignments", error });
  }
};

export const getAssignmentById = async (req: Request, res: Response) => {
  try {
    const assignment = await turnAssignmentService.getAssignmentById(req.params.id);
    res.json(assignment);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error fetching assignment", error });
  }
};

export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await turnAssignmentService.updateAssignment(req.params.id, req.body);
    res.json(assignment);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error updating assignment", error });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    await turnAssignmentService.deleteAssignment(req.params.id);
    res.json({ message: "Assignment deleted successfully" });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error deleting assignment", error });
  }
};


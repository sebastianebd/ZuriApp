import { Request, Response } from "express";
import { ShiftExceptionModel } from "../models/shift-exception.model";
import auditService from "../services/audit.service";
import { AuthRequest } from "../middleware/authentication.middleware";

export const createException = async (req: Request, res: Response) => {
  try {
    const {
      assignment_id,
      date,
      original_type,
      override_type,
      reason,
      created_by,
    } = req.body;

    // Use findOneAndUpdate with upsert to update existing or create new
    // We include original_type in the update payload. For new records it's essential.
    // For existing records, it might update it if the pattern changed underneath (though rare being an exception)
    const exception = await ShiftExceptionModel.findOneAndUpdate(
      { assignment_id, date: new Date(date) },
      {
        original_type,
        override_type,
        reason,
        created_by,
        created_at: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate({
      path: "assignment_id",
      populate: { path: "user_id", select: "nombre apellido" },
    });

    // Audit Creation/Modification
    const authReq = req as AuthRequest;
    if (authReq.user) {
      const targetUser = (exception.assignment_id as any).user_id;
      const formattedDate = new Date(date).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      await auditService.logAction(
        "MODIFICAR",
        "TURNOS",
        authReq.user,
        `Se modificó el turno de ${targetUser.nombre} ${targetUser.apellido} (Cambios: turno: ${original_type} -> ${override_type} para el día ${formattedDate})`,
        {
          exception_id: exception._id,
          assignment_id: assignment_id,
          date: new Date(date),
          original_type,
          override_type,
          reason,
        },
        exception._id.toString()
      );
    }

    res.json(exception);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error creating/updating exception", error });
  }
};

export const getExceptions = async (req: Request, res: Response) => {
  try {
    const { assignment_id, start_date, end_date } = req.query;

    const query: any = {};
    if (assignment_id) query.assignment_id = assignment_id;
    if (start_date && end_date) {
      // Adjust end_date to include the entire day (23:59:59)
      const endDateTime = new Date(end_date as string);
      endDateTime.setHours(23, 59, 59, 999);

      query.date = {
        $gte: new Date(start_date as string),
        $lte: endDateTime,
      };
    }

    const exceptions = await ShiftExceptionModel.find(query)
      .populate({
        path: "assignment_id",
        select: "user_id turn_type service",
        populate: {
          path: "user_id",
          select: "nombre apellido servicio tipo_cargo",
        },
      })
      .populate("created_by", "nombre apellido")
      .sort({ date: 1 });

    res.json(exceptions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching exceptions", error });
  }
};

export const getExceptionById = async (req: Request, res: Response) => {
  try {
    const exception = await ShiftExceptionModel.findById(req.params.id)
      .populate("assignment_id")
      .populate("created_by", "nombre apellido");

    if (!exception) {
      return res.status(404).json({ message: "Exception not found" });
    }
    res.json(exception);
  } catch (error) {
    res.status(500).json({ message: "Error fetching exception", error });
  }
};

export const deleteException = async (req: Request, res: Response) => {
  try {
    // 1. Find document before deleting (Undo Audit)
    // 1. Find document before deleting (Undo Audit)
    const exception = await ShiftExceptionModel.findById(
      req.params.id
    ).populate({
      path: "assignment_id",
      populate: { path: "user_id", select: "nombre apellido" },
    });

    if (!exception) {
      return res.status(404).json({ message: "Exception not found" });
    }

    // 2. Audit the Reversion (The "Undo" logic)
    const authReq = req as AuthRequest;
    if (authReq.user) {
      const targetUser = (exception.assignment_id as any).user_id;
      const formattedDate = new Date(exception.date).toLocaleDateString(
        "es-CL",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );

      await auditService.logAction(
        "MODIFICAR", // Unified Action
        "TURNOS",
        authReq.user,
        `Se modificó el turno de ${targetUser.nombre} ${targetUser.apellido} (Cambios: turno: ${exception.override_type} -> ${exception.original_type} para el día ${formattedDate})`,
        {
          exception_id: exception._id,
          assignment_id: exception.assignment_id,
          date: exception.date,
          reverted_override: exception.override_type,
          restored_original: exception.original_type,
          reason: exception.reason,
        },
        exception._id.toString()
      );
    }

    // 3. Delete
    await ShiftExceptionModel.findByIdAndDelete(req.params.id);

    res.json({ message: "Exception deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting exception", error });
  }
};

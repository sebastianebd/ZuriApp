import { Request, Response } from "express";
import { ShiftExceptionModel } from "../models/shift-exception.model";
import auditService from "../services/audit.service";
import { AuthRequest } from "../middleware/authentication.middleware";

export const createException = async (req: Request, res: Response) => {
  try {
    const {
      assignment_id,
      assignment_model = "TurnAssignment", // Default for backward compatibility
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
        assignment_model, // Save the model type
        original_type,
        override_type,
        reason,
        created_by,
        created_at: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).populate({
      path: "assignment_id",
      // Dynamic populate based on model is tricky in single statement if fields differ widely
      // But Mongoose handles it if we don't specify strict path selection that fails,
      // or we accept that for Replacement we might get different fields.
      // For TurnAssignment: populate user_id
      // For Replacement: user info is at root
    });

    // Manually populate nested user if it's TurnAssignment
    if (exception.assignment_model === "TurnAssignment") {
      await exception.populate({
        path: "assignment_id.user_id",
        select: "nombre apellido",
      });
    }

    // Audit Creation/Modification
    const authReq = req as AuthRequest;
    if (authReq.user) {
      let targetName = "Desconocido";
      const assignment: any = exception.assignment_id;

      if (exception.assignment_model === "Replacement") {
        // Replacement model has names at root
        targetName = `${assignment.nombre_entrante} ${assignment.apellido_entrante}`;
      } else {
        // TurnAssignment model has user_id ref
        const u = assignment.user_id;
        if (u) {
          targetName = `${u.nombre} ${u.apellido}`;
        }
      }

      const formattedDate = new Date(date).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      await auditService.logAction(
        "MODIFICAR",
        "TURNOS",
        authReq.user,
        `Se modificó el turno de ${targetName} (Cambios: turno: ${original_type} -> ${override_type} para el día ${formattedDate})`,
        {
          exception_id: exception._id,
          assignment_id: assignment_id,
          assignment_model,
          date: new Date(date),
          original_type,
          override_type,
          reason,
        },
        exception._id.toString(),
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
      .populate("created_by", "nombre apellido")
      .populate({
        path: "assignment_id",
        // We populate the assignment itself (TurnAssignment or Replacement)
      })
      .sort({ date: 1 });

    // Polymorphic Population:
    // Only populate nested user_id if the assignment is a TurnAssignment
    // Replacements have user info at the root level
    const turnAssignmentExceptions = exceptions.filter(
      (e) => e.assignment_model === "TurnAssignment",
    );

    if (turnAssignmentExceptions.length > 0) {
      await ShiftExceptionModel.populate(turnAssignmentExceptions, {
        path: "assignment_id.user_id",
        select: "nombre apellido servicio tipo_cargo",
        model: "User",
      });
    }

    // Populate id_entrante for Replacements to get tipo_cargo
    const replacementExceptions = exceptions.filter(
      (e) => e.assignment_model === "Replacement",
    );

    if (replacementExceptions.length > 0) {
      await ShiftExceptionModel.populate(replacementExceptions, {
        path: "assignment_id.id_entrante",
        select: "nombre apellido tipo_cargo servicio",
        model: "User",
      });
    }

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
      req.params.id,
    ).populate("assignment_id");

    if (!exception) {
      return res.status(404).json({ message: "Exception not found" });
    }

    // Conditionally populate user if TurnAssignment
    if (exception.assignment_model === "TurnAssignment") {
      await exception.populate({
        path: "assignment_id.user_id",
        select: "nombre apellido",
      });
    }

    // 2. Audit the Reversion (The "Undo" logic)
    const authReq = req as AuthRequest;
    if (authReq.user) {
      let targetName = "Desconocido";
      const assignment: any = exception.assignment_id;

      if (exception.assignment_model === "Replacement") {
        targetName = `${assignment.nombre_entrante} ${assignment.apellido_entrante}`;
      } else {
        const u = assignment.user_id;
        if (u) targetName = `${u.nombre} ${u.apellido}`;
      }

      const formattedDate = new Date(exception.date).toLocaleDateString(
        "es-CL",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        },
      );

      await auditService.logAction(
        "MODIFICAR", // Unified Action
        "TURNOS",
        authReq.user,
        `Se modificó el turno de ${targetName} (Cambios: turno: ${exception.override_type} -> ${exception.original_type} para el día ${formattedDate})`,
        {
          exception_id: exception._id,
          assignment_id: exception.assignment_id,
          date: exception.date,
          reverted_override: exception.override_type,
          restored_original: exception.original_type,
          reason: exception.reason,
        },
        exception._id.toString(),
      );
    }

    // 3. Delete
    await ShiftExceptionModel.findByIdAndDelete(req.params.id);

    res.json({ message: "Exception deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting exception", error });
  }
};

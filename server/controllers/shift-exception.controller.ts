import { Request, Response } from "express";
import { ShiftExceptionModel } from "../models/shift-exception.model";
import auditService from "../services/audit.service";
import socketService from "../services/socket.service";
import { AuthRequest } from "../middleware/authentication.middleware";
import { TurnAssignmentModel } from "../models/turn-assignment.model";
import ReplacementModel from "../models/replacement.model";

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

    // Deduce assignment_model dynamically
    let assignment_model = "TurnAssignment";
    const [turnAssignment, replacement] = await Promise.all([
      TurnAssignmentModel.findById(assignment_id),
      ReplacementModel.findById(assignment_id),
    ]);

    if (turnAssignment) {
      assignment_model = "TurnAssignment";
    } else if (replacement) {
      assignment_model = "Replacement";
    } else {
      return res.status(404).json({ message: "Assignment not found in TurnAssignment or Replacement" });
    }

    // Upsert Logic (Crear o Actualizar)
    // Utilizamos findOneAndUpdate para manejar condiciones de carrera de forma atómica.
    // 'original_type' se guarda siempre, crucial para la reversión (Undo).
    const exception = await ShiftExceptionModel.findOneAndUpdate(
      { assignment_id, date: new Date(date) },
      {
        assignment_model,
        original_type,
        override_type,
        reason,
        created_by,
        created_at: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).populate({
      path: "assignment_id",
      // Populate Dinámico: Mongoose resuelve el modelo correcto (TurnAssignment o Replacement)
      // basado en 'assignment_model' (Polymorphic Association).
    });

    // Populate Manual Anidado
    // Si es un TurnAssignment, necesitamos llegar al usuario final para obtener su nombre.
    if (exception.assignment_model === "TurnAssignment") {
      await exception.populate({
        path: "assignment_id.user_id",
        select: "nombre apellido",
      });
    }

    // Auditoría de Modificación
    const authReq = req as AuthRequest;
    if (authReq.user) {
      let targetName = "Desconocido";
      const assignment: any = exception.assignment_id;

      if (exception.assignment_model === "Replacement") {
        // En Reemplazos, los datos del usuario están en la raíz del documento
        targetName = `${assignment.nombre_entrante} ${assignment.apellido_entrante}`;
      } else {
        // En Asignaciones, están en la referencia 'user_id'
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
        "Excepciones de Turno",
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

    // Notificación en Tiempo Real (Socket)
    if (exception.assignment_id) {
      let targetId = "";
      const assignment: any = exception.assignment_id;

      if (
        exception.assignment_model === "TurnAssignment" &&
        assignment.user_id
      ) {
        targetId = assignment.user_id._id
          ? assignment.user_id._id.toString()
          : assignment.user_id.toString();
      } else if (
        exception.assignment_model === "Replacement" &&
        assignment.id_entrante
      ) {
        targetId = assignment.id_entrante.toString();
      }

      if (targetId) {
        socketService.emitTurnUpdate(targetId);
      }
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
      // Ajuste de Rango Diario
      // Extendemos end_date al final del día (23:59:59) para asegurar cobertura completa.
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
      })
      .sort({ date: 1 });

    // Populate Polimórfico Condicional:
    // Filtramos y populamos datos específicos según el tipo de asignación subyacente.

    // Caso 1: Asignaciones Regulares (TurnAssignment) -> Populamos user_id
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

    // Caso 2: Reemplazos -> Populamos id_entrante
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
    // 1. Recuperación Previa (Para Auditoría de Reversión)
    const exception = await ShiftExceptionModel.findById(
      req.params.id,
    ).populate("assignment_id");

    if (!exception) {
      return res.status(404).json({ message: "Exception not found" });
    }

    // Populate Condicional para obtener nombres logs
    if (exception.assignment_model === "TurnAssignment") {
      await exception.populate({
        path: "assignment_id.user_id",
        select: "nombre apellido",
      });
    }

    // 2. Auditoría tipo "Undo"
    // Registramos explícitamente que se revirtió una excepción (Cambio: Override -> Original)
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
        "MODIFICAR", // Acción Unificada
        "Excepciones de Turno",
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

    // 3. Eliminación Física
    await ShiftExceptionModel.findByIdAndDelete(req.params.id);

    res.json({ message: "Exception deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting exception", error });
  }
};

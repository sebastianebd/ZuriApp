import { ShiftExceptionModel } from "../models/shift-exception.model";
import { TurnAssignmentModel } from "../models/turn-assignment.model";
import ReplacementModel from "../models/replacement.model";
import auditService from "../services/audit.service";
import socketService from "../services/socket.service";
import { AppError } from "../errors/app-error";

/**
 * Servicio para gestionar Excepciones de Turno (Polymorphic: Asignaciones o Reemplazos).
 */

async function createException(payload: any, currentUser: any) {
  const {
    assignment_id,
    date,
    original_type,
    override_type,
    reason,
    created_by,
  } = payload;

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
    throw new AppError(404, "Assignment not found in TurnAssignment or Replacement");
  }

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
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate({ path: "assignment_id" });

  if (exception.assignment_model === "TurnAssignment") {
    await exception.populate({
      path: "assignment_id.user_id",
      select: "firstName lastName",
    });
  }

  if (currentUser) {
    let targetName = "Desconocido";
    const assignment: any = exception.assignment_id;

    if (exception.assignment_model === "Replacement") {
      targetName = `${assignment.nombre_entrante} ${assignment.apellido_entrante}`;
    } else {
      const u = assignment.user_id;
      if (u) {
        targetName = `${u.firstName} ${u.lastName}`;
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
      currentUser,
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
      exception._id.toString()
    );
  }

  if (exception.assignment_id) {
    let targetId = "";
    const assignment: any = exception.assignment_id;

    if (exception.assignment_model === "TurnAssignment" && assignment.user_id) {
      targetId = assignment.user_id._id
        ? assignment.user_id._id.toString()
        : assignment.user_id.toString();
    } else if (exception.assignment_model === "Replacement" && assignment.id_entrante) {
      targetId = assignment.id_entrante.toString();
    }

    if (targetId) {
      socketService.emitTurnUpdate(targetId);
    }
  }

  return exception;
}

async function getExceptions(filters: any) {
  const { assignment_id, start_date, end_date } = filters;

  const query: any = {};
  if (assignment_id) query.assignment_id = assignment_id;
  if (start_date && end_date) {
    const endDateTime = new Date(end_date as string);
    endDateTime.setHours(23, 59, 59, 999);

    query.date = {
      $gte: new Date(start_date as string),
      $lte: endDateTime,
    };
  }

  const exceptions = await ShiftExceptionModel.find(query)
    .populate("created_by", "firstName lastName")
    .populate({ path: "assignment_id" })
    .sort({ date: 1 });

  const turnAssignmentExceptions = exceptions.filter(
    (e) => e.assignment_model === "TurnAssignment"
  );

  if (turnAssignmentExceptions.length > 0) {
    await ShiftExceptionModel.populate(turnAssignmentExceptions, {
      path: "assignment_id.user_id",
      select: "firstName lastName roleId positionId",
      model: "Staff",
    });
  }

  const replacementExceptions = exceptions.filter(
    (e) => e.assignment_model === "Replacement"
  );

  if (replacementExceptions.length > 0) {
    await ShiftExceptionModel.populate(replacementExceptions, {
      path: "assignment_id.id_entrante",
      select: "firstName lastName roleId positionId",
      model: "Staff",
    });
  }

  return exceptions;
}

async function getExceptionById(id: string) {
  const exception = await ShiftExceptionModel.findById(id)
    .populate("assignment_id")
    .populate("created_by", "firstName lastName");

  if (!exception) {
    throw new AppError(404, "Exception not found");
  }
  return exception;
}

async function deleteException(id: string, currentUser: any) {
  const exception = await ShiftExceptionModel.findById(id).populate("assignment_id");

  if (!exception) {
    throw new AppError(404, "Exception not found");
  }

  if (exception.assignment_model === "TurnAssignment") {
    await exception.populate({
      path: "assignment_id.user_id",
      select: "firstName lastName",
    });
  }

  if (currentUser) {
    let targetName = "Desconocido";
    const assignment: any = exception.assignment_id;

    if (exception.assignment_model === "Replacement") {
      targetName = `${assignment.nombre_entrante} ${assignment.apellido_entrante}`;
    } else {
      const u = assignment.user_id;
      if (u) targetName = `${u.firstName} ${u.lastName}`;
    }

    const formattedDate = new Date(exception.date).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    await auditService.logAction(
      "MODIFICAR",
      "Excepciones de Turno",
      currentUser,
      `Se modificó el turno de ${targetName} (Cambios: turno: ${exception.override_type} -> ${exception.original_type} para el día ${formattedDate})`,
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

  await ShiftExceptionModel.findByIdAndDelete(id);
}

export default {
  createException,
  getExceptions,
  getExceptionById,
  deleteException,
};

import { TurnAssignmentModel } from "../models/turn-assignment.model";
import auditService from "../services/audit.service";
import TurnType from "../models/turn-type.model";
import notificationService from "../services/notification.service";
import { AppError } from "../errors/app-error";
import { escapeRegex } from "../utils/regex";
import Staff from "../models/staff.model";

/**
 * Servicio para gestionar Asignaciones de Turnos (Snapshotting, Overlaps).
 */

async function createAssignment(payload: any, currentUser: any, userRoleLevel: number) {
  const { staffId, turn_type, start_date, end_date } = payload;

  const targetStaff = await Staff.findById(staffId).populate("roleId");
  if (!targetStaff) throw new AppError(404, "Funcionario no encontrado");
  const targetRole = targetStaff.roleId as any;
  if (userRoleLevel <= targetRole.level) {
    throw new AppError(403, "No tienes jerarquía suficiente para asignar turnos a este funcionario");
  }


  const turnTypeDoc = await TurnType.findOne({
    nombre: { $regex: new RegExp(`^${escapeRegex(turn_type)}$`, "i") },
    deleted_at: null,
  });

  if (!turnTypeDoc) {
    throw new AppError(404, "Tipo de turno no encontrado o eliminado");
  }

  const newStart = new Date(start_date);
  const newEnd = end_date ? new Date(end_date) : new Date(9999, 11, 31);

  const overlapQuery: any = {
    staffId: staffId,
    $or: [
      {
        start_date: { $lte: newEnd },
        end_date: { $ne: null, $gte: newStart },
      },
      {
        end_date: null,
        start_date: { $lte: newEnd },
      },
    ],
  };

  const existingOverlap = await TurnAssignmentModel.findOne(overlapQuery);

  if (existingOverlap) {
    throw new AppError(409, "El funcionario ya tiene un turno asignado que se traslapa con estas fechas.", { overlapId: existingOverlap._id });
  }

  const assignmentPayload = {
    ...payload,
    turn_type: turnTypeDoc._id,
    snapshot_secuencia: turnTypeDoc.toObject().secuencia.map((item: any) => {
      const { color, ...rest } = item;
      return rest;
    }),
  };

  const assignment = await TurnAssignmentModel.create(assignmentPayload);
  await assignment.populate("staffId", "firstName lastName rut");

  if (currentUser) {
    const targetStaff = assignment.staffId as any;
    await auditService.logAction(
      "CREAR",
      "Turnos Actuales",
      currentUser,
      `Asignación de turno creada para ${targetStaff.firstName} ${targetStaff.lastName} (${turn_type})`,
      {
        assignment_id: assignment._id,
        target_staffId: targetStaff._id,
        turn_type: assignment.turn_type,
        start_date: assignment.start_date,
        end_date: assignment.end_date,
      },
      assignment._id.toString()
    );
  }

  notificationService
    .notifyShiftAssignment({
      ...assignment.toObject(),
      staffId: assignment.staffId,
      turn_type_name: turnTypeDoc.nombre,
    })
    .catch((err) =>
      console.error("Error sending WhatsApp notification:", err)
    );

  return assignment;
}

async function getAssignments(filters: any) {
  return await TurnAssignmentModel.find(filters)
    .populate({ path: "staffId", select: "firstName lastName rut positionId", populate: { path: "positionId", select: "name" } })
    .sort({ start_date: 1 });
}

async function getAssignmentById(id: string) {
  const assignment = await TurnAssignmentModel.findById(id).populate("staffId");
  if (!assignment) {
    throw new AppError(404, "Assignment not found");
  }
  return assignment;
}

async function updateAssignment(id: string, payload: any, userRoleLevel: number) {
  const assignmentToUpdate = await TurnAssignmentModel.findById(id).populate({
    path: "staffId",
    populate: { path: "roleId" }
  });
  if (!assignmentToUpdate) throw new AppError(404, "Assignment not found");

  const targetStaff = assignmentToUpdate.staffId as any;
  if (targetStaff && targetStaff.roleId) {
    const targetRole = targetStaff.roleId as any;
    if (userRoleLevel <= targetRole.level) {
      throw new AppError(403, "No tienes jerarquía suficiente para modificar los turnos de este funcionario");
    }
  }
  const assignment = await TurnAssignmentModel.findByIdAndUpdate(
    id,
    payload,
    { new: true }
  ).populate("staffId");
  
  if (!assignment) {
    throw new AppError(404, "Assignment not found");
  }
  return assignment;
}

async function deleteAssignment(id: string, userRoleLevel: number) {
  const assignmentToDelete = await TurnAssignmentModel.findById(id).populate({
    path: "staffId",
    populate: { path: "roleId" }
  });
  if (!assignmentToDelete) throw new AppError(404, "Assignment not found");

  const targetStaff = assignmentToDelete.staffId as any;
  if (targetStaff && targetStaff.roleId) {
    const targetRole = targetStaff.roleId as any;
    if (userRoleLevel <= targetRole.level) {
      throw new AppError(403, "No tienes jerarquía suficiente para eliminar los turnos de este funcionario");
    }
  }
  const assignment = await TurnAssignmentModel.findByIdAndDelete(id);
  if (!assignment) {
    throw new AppError(404, "Assignment not found");
  }
  return assignment;
}

export default {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};

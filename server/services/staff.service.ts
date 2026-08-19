import mongoose, { FilterQuery } from "mongoose";
import Staff, { IStaff } from "../models/staff.model";
import Account from "../models/account.model"; // TODO: To be removed, ensuring it doesn't break
import Role from "../models/role.model";
import accountService from "./account.service";
import { get, set, delPattern } from "../config/redis.config";
import socketIO from "../config/socket";
import { buildAccentInsensitiveRegex } from "../utils/formatters";

/**
 * Incorpora un nuevo miembro del personal o restaura uno eliminado lógicamente (Verificación de Reingreso).
 * Transaccionalmente crea una Cuenta si su Rol le otorga acceso al sistema.
 */
async function onboardStaff(payload: Partial<IStaff>, reqRoleLevel: number) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!payload.rut) throw new Error("RUT is required");
    if (!payload.roleId) throw new Error("Role ID is required");

    // IDOR Check
    const role = await Role.findById(payload.roleId).session(session);
    if (!role) throw new Error("El rol especificado no existe");

    if (reqRoleLevel <= role.level) {
      const error: any = new Error(
        "No tienes permisos para crear o restaurar un usuario con jerarquía igual o superior a la tuya",
      );
      error.statusCode = 403;
      throw error;
    }

    // 1. Verificación de Reingreso
    let staff = await Staff.findOne({ rut: payload.rut }).session(session);

    if (staff) {
      if (!staff.isDeleted) {
        throw new Error("El RUT ya existe en los registros de personal activo");
      }
      // Restaurar staff
      Object.assign(staff, payload);
      staff.isDeleted = false;
      await staff.save({ session });
    } else {
      // Crear nuevo staff
      const [newStaff] = await Staff.create([payload], { session });
      staff = newStaff;
    }

    // 2. Verificación de Rol para acceso al sistema
    if (role.hasSystemAccess) {
      // Crear Cuenta
      await accountService.createAccountForStaff(staff, session);
    }

    await session.commitTransaction();

    await delPattern("staff:*");
    try {
      const io = socketIO.getIO();
      io.emit("staff:update", { action: "create", staff });
    } catch (err) {}

    return staff;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Actualiza la información de un miembro del personal y gestiona cambios de rol.
 * Si es promovido (de sin-acceso a con-acceso), crea una Cuenta.
 * Si es degradado (de con-acceso a sin-acceso), elimina permanentemente (hard-delete) la Cuenta.
 */
async function updateStaff(
  staffId: string,
  payload: Partial<IStaff>,
  reqRoleLevel: number,
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const staff = await Staff.findById(staffId)
      .session(session)
      .populate("roleId");
    if (!staff) throw new Error("Staff no encontrado");

    const targetRole = staff.roleId as any;
    if (reqRoleLevel <= targetRole.level) {
      const error: any = new Error(
        "No tienes permisos para modificar a un usuario con jerarquía igual o superior a la tuya",
      );
      error.statusCode = 403;
      throw error;
    }

    // Verificar si el Rol está siendo cambiado
    if (
      payload.roleId &&
      payload.roleId.toString() !== staff.roleId._id.toString()
    ) {
      const oldRole = targetRole;
      const newRole = await Role.findById(payload.roleId).session(session);

      if (!newRole) throw new Error("Rol no encontrado");

      if (reqRoleLevel <= newRole.level) {
        const error: any = new Error(
          "No tienes permisos para asignar un rol con jerarquía igual o superior a la tuya",
        );
        error.statusCode = 403;
        throw error;
      }

      // Verificar Promoción
      if (!oldRole.hasSystemAccess && newRole.hasSystemAccess) {
        await accountService.createAccountForStaff(
          Object.assign(staff, payload),
          session,
        );
      }

      // Verificar Degradación
      if (oldRole.hasSystemAccess && !newRole.hasSystemAccess) {
        await accountService.revokeAccount(staff._id.toString(), session);
      }
    }

    // Actualizar el documento staff
    Object.assign(staff, payload);
    await staff.save({ session });

    await session.commitTransaction();

    await delPattern("staff:*");
    try {
      const io = socketIO.getIO();
      io.emit("staff:update", { action: "update", staffId });
    } catch (err) {}

    return staff;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Desvincula a un miembro del personal.
 * Realiza un Soft Delete en Staff (isDeleted = true)
 * Realiza un Hard Delete en Account para revocar el acceso inmediatamente.
 */
async function deleteStaff(staffId: string, reqRoleLevel: number) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const staff = await Staff.findById(staffId)
      .session(session)
      .populate("roleId");
    if (!staff) throw new Error("Staff no encontrado");

    const targetRole = staff.roleId as any;
    if (reqRoleLevel <= targetRole.level) {
      const error: any = new Error(
        "No tienes permisos para eliminar a un usuario con jerarquía igual o superior a la tuya",
      );
      error.statusCode = 403;
      throw error;
    }

    // 1. Soft Delete Staff
    staff.isDeleted = true;
    staff.isActive = false;
    await staff.save({ session });

    // 2. Hard Delete Account
    await accountService.revokeAccount(staff._id.toString(), session);

    await session.commitTransaction();

    await delPattern("staff:*");
    try {
      const io = socketIO.getIO();
      io.emit("staff:update", { action: "delete", staffId });
    } catch (err) {}

    return staff;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function getStaffById(staffId: string) {
  return await Staff.findById(staffId)
    .populate("roleId")
    .populate("positionId")
    .lean();
}

async function getAllStaff(options: {
  search?: string;
  rut?: string;
  roleId?: string;
  positionId?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  userRoleLevel?: number;
}) {
  const {
    search,
    rut,
    page,
    limit,
    roleId,
    positionId,
    isActive,
    userRoleLevel = 0,
  } = options;
  const cacheKey = `staff:p${page}:l${limit}:s${search || "none"}:rut${rut || "none"}:r${roleId || ""}:pos${positionId || ""}:act${isActive !== undefined ? isActive : ""}:lvl${userRoleLevel}`;

  const cachedData = await get(cacheKey);
  if (cachedData) return cachedData;
  const query: FilterQuery<IStaff> = { isDeleted: false };

  if (search && search.trim().length > 0) {
    const terms = search.trim().split(/\s+/);
    const andConditions = terms.map((term) => {
      let safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      safeTerm = buildAccentInsensitiveRegex(safeTerm);
      const regex = new RegExp("^" + safeTerm, "i");
      return {
        $or: [{ firstName: regex }, { lastName: regex }],
      };
    });

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }
  }

  if (options.rut) {
    const rawRut = options.rut.replace(/[^0-9kK]/gi, '');
    let regexStr = rawRut;
    if (rawRut.length > 1) {
      regexStr = rawRut.slice(0, -1) + '-?' + rawRut.slice(-1);
    }
    query.rut = new RegExp("^" + regexStr, "i");
  }
  if (options.roleId) query.roleId = options.roleId;
  if (options.positionId) query.positionId = options.positionId;
  if (options.isActive !== undefined) query.isActive = options.isActive;

  const skip = (page - 1) * limit;

  const [staffList, total] = await Promise.all([
    Staff.find(query)
      .populate("roleId", "name level code")
      .populate("positionId", "name")
      .skip(skip)
      .limit(limit)
      .lean(),
    Staff.countDocuments(query),
  ]);

  const result = {
    staff: staffList,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
    },
  };

  await set(cacheKey, result, 60);
  return result;
}

export default {
  onboardStaff,
  updateStaff,
  deleteStaff,
  getStaffById,
  getAllStaff,
};

import mongoose, { FilterQuery } from 'mongoose';
import Staff, { IStaff } from '../models/staff.model';
import Account from '../models/account.model';
import Role from '../models/role.model';
import { emailQueue } from '../queues/email.queue';
import crypto from 'crypto';
import { get, set, delPattern } from "../config/redis.config";
import socketIO from "../config/socket";

/**
 * Incorpora un nuevo miembro del personal o restaura uno eliminado lógicamente (Verificación de Reingreso).
 * Transaccionalmente crea una Cuenta si su Rol le otorga acceso al sistema.
 */
async function onboardStaff(payload: Partial<IStaff>) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!payload.rut) throw new Error('RUT is required');
    if (!payload.roleId) throw new Error('Role ID is required');

    // 1. Verificación de Reingreso
    let staff = await Staff.findOne({ rut: payload.rut }).session(session);

    if (staff) {
      if (!staff.isDeleted) {
        throw new Error('El RUT ya existe en los registros de personal activo');
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
    const role = await Role.findById(payload.roleId).session(session);
    if (!role) throw new Error('El rol especificado no existe');

    if (role.hasSystemAccess) {
      // Crear Cuenta
      const resetToken = crypto.randomBytes(20).toString('hex');
      
      await Account.create([{
        staffId: staff._id,
        rut: staff.rut,
        isActive: false, // Pendiente OTL (One Time Link)
        resetPasswordToken: resetToken,
        resetPasswordExpire: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
      }], { session });

      // Encolar email OTL
      if (payload.email) {
        await emailQueue.add('sendOTL', {
          to: payload.email,
          subject: 'Tus credenciales de acceso',
          template: 'otl-welcome',
          context: {
            name: staff.firstName,
            token: resetToken,
            rut: staff.rut,
          }
        });
      }
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
async function updateStaff(staffId: string, payload: Partial<IStaff>) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const staff = await Staff.findById(staffId).session(session);
    if (!staff) throw new Error('Staff no encontrado');

    // Verificar si el Rol está siendo cambiado
    if (payload.roleId && payload.roleId.toString() !== staff.roleId.toString()) {
      const oldRole = await Role.findById(staff.roleId).session(session);
      const newRole = await Role.findById(payload.roleId).session(session);

      if (!oldRole || !newRole) throw new Error('Rol no encontrado');

      // Verificar Promoción
      if (!oldRole.hasSystemAccess && newRole.hasSystemAccess) {
        const resetToken = crypto.randomBytes(20).toString('hex');
        
        await Account.create([{
          staffId: staff._id,
          rut: staff.rut,
          isActive: false, // Pendiente OTL
          resetPasswordToken: resetToken,
          resetPasswordExpire: Date.now() + 24 * 60 * 60 * 1000,
        }], { session });

        const targetEmail = payload.email || staff.email;
        if (targetEmail) {
          await emailQueue.add('sendOTL', {
            to: targetEmail,
            subject: 'Tus credenciales de acceso',
            template: 'otl-welcome',
            context: {
              name: payload.firstName || staff.firstName,
              token: resetToken,
              rut: staff.rut,
            }
          });
        }
      }
      
      // Verificar Degradación
      if (oldRole.hasSystemAccess && !newRole.hasSystemAccess) {
        await Account.deleteOne({ staffId: staff._id }).session(session);
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
async function deleteStaff(staffId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const staff = await Staff.findById(staffId).session(session);
    if (!staff) throw new Error('Staff no encontrado');

    // 1. Soft Delete Staff
    staff.isDeleted = true;
    staff.status = 'INACTIVO';
    await staff.save({ session });

    // 2. Hard Delete Account
    await Account.deleteOne({ staffId: staff._id }).session(session);

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
  return await Staff.findById(staffId).populate('roleId').populate('positionId').lean();
}

async function getAllStaff(options: {
  search?: string;
  roleId?: string;
  positionId?: string;
  status?: string;
  page: number;
  limit: number;
  userRoleLevel?: number;
}) {
  const { search, page, limit, roleId, positionId, status, userRoleLevel = 0 } = options;
  const cacheKey = `staff:p${page}:l${limit}:s${search || "none"}:r${roleId || ""}:pos${positionId || ""}:st${status || ""}:lvl${userRoleLevel}`;

  const cachedData = await get(cacheKey);
  if (cachedData) return cachedData;
  const query: FilterQuery<IStaff> = { isDeleted: false };

  if (search && search.trim().length > 0) {
    const terms = search.trim().toUpperCase().split(/\s+/);
    const andConditions = terms.map((term) => {
      const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp("^" + safeTerm);
      return {
        $or: [{ rut: regex }, { firstName: regex }, { lastName: regex }],
      };
    });

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }
  }

  if (options.roleId) query.roleId = options.roleId;
  if (options.positionId) query.positionId = options.positionId;
  if (options.status) query.status = options.status;

  const skip = (page - 1) * limit;

  const [staffList, total] = await Promise.all([
    Staff.find(query)
      .populate('roleId', 'name level code')
      .populate('positionId', 'name')
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

async function sendResetLink(staffId: string): Promise<void> {
  const staff = await Staff.findById(staffId).populate('roleId');
  if (!staff) {
    throw new Error("Personal no encontrado");
  }

  const role = staff.roleId as any;
  if (!role || !role.hasSystemAccess) {
    throw new Error("Este personal no tiene acceso al sistema");
  }

  const { generateResetToken } = await import("./auth.service");
  const { rawToken } = await generateResetToken(staff._id.toString());
  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/setup-password?token=${rawToken}`;

  await emailQueue.add("send-welcome-email", {
    to: staff.email,
    nombre: `${staff.firstName} ${staff.lastName}`,
    rut: staff.rut,
    resetLink,
    isReset: true,
  });
}

export default {
  onboardStaff,
  updateStaff,
  deleteStaff,
  getStaffById,
  getAllStaff,
  sendResetLink,
};

import mongoose from 'mongoose';
import Account from '../models/account.model';
import Staff from '../models/staff.model';
import { emailQueue } from '../queues/email.queue';
import crypto from 'crypto';
import auditService from './audit.service';
import socketIO from '../config/socket';

/**
 * Creates an account for a given staff member.
 * Must be executed within a mongoose session.
 */
async function createAccountForStaff(staff: any, session: mongoose.ClientSession) {
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  await Account.create([{
    staffId: staff._id,
    rut: staff.rut,
    isActive: false, // Pendiente OTL
    resetPasswordToken: resetToken,
    resetPasswordExpire: Date.now() + 24 * 60 * 60 * 1000,
  }], { session });

  if (staff.email) {
    await emailQueue.add('sendOTL', {
      to: staff.email,
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

/**
 * Hard deletes an account for a staff member.
 * Must be executed within a mongoose session.
 */
async function revokeAccount(staffId: string | mongoose.Types.ObjectId, session: mongoose.ClientSession) {
  await Account.deleteOne({ staffId }).session(session);
}

/**
 * Toggles the active status of an account. 
 * Includes IDOR protection based on role levels.
 */
async function toggleAccountStatus(staffId: string, isActive: boolean, reqStaffRoleLevel: number, reqAccount: { id: string; name: string }) {
  const staff = await Staff.findById(staffId).populate('roleId');
  if (!staff) throw new Error("Personal no encontrado");

  const targetRole = staff.roleId as any;
  if (!targetRole) throw new Error("El personal no tiene rol asignado");
  
  if (reqStaffRoleLevel <= targetRole.level) {
    const error: any = new Error("No tienes permisos para modificar el estado de la cuenta de un usuario con jerarquía igual o superior");
    error.statusCode = 403;
    throw error;
  }

  const account = await Account.findOne({ staffId }).select('+password');
  if (!account) throw new Error("La cuenta no existe");

  if (isActive && !account.password) {
    const err: any = new Error("No se puede habilitar una cuenta que aún no ha completado el Onboarding (no tiene contraseña)");
    err.statusCode = 400;
    throw err;
  }

  const oldData = { isActive: account.isActive };
  const newData = { isActive };

  account.isActive = isActive;
  await account.save();

  if (!isActive) {
    try {
      const io = socketIO.getIO();
      io.emit("account:suspended", { staffId });
    } catch (err) {}
  }

  const diff = auditService.generateDiff(oldData, newData, "Account");
  if (diff) {
    await auditService.logAction(
      "UPDATE",
      "Account",
      reqAccount,
      `Estado de cuenta de ${staff.firstName} ${staff.lastName} modificado`,
      diff,
      account._id.toString()
    );
  }

  return account;
}

async function sendResetLink(staffId: string, reqStaffRoleLevel: number, reqAccount: { id: string; name: string }): Promise<void> {
  const staff = await Staff.findById(staffId).populate('roleId');
  if (!staff) throw new Error("Personal no encontrado");

  const role = staff.roleId as any;
  if (!role || !role.hasSystemAccess) {
    throw new Error("Este personal no tiene acceso al sistema");
  }

  if (reqStaffRoleLevel <= role.level) {
    const error: any = new Error("No tienes permisos para resetear la contraseña de un usuario con jerarquía igual o superior");
    error.statusCode = 403;
    throw error;
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

  await auditService.logAction(
    "UPDATE",
    "Account",
    reqAccount,
    `Enlace de restablecimiento de contraseña enviado a ${staff.firstName} ${staff.lastName}`,
    "resetPasswordToken generado",
    staffId
  );
}

async function getAccountStatus(staffId: string) {
  const account = await Account.findOne({ staffId }).select('+password');
  if (!account) {
    return { isActive: false, isPendingOnboarding: false, exists: false };
  }
  return {
    isActive: account.isActive,
    isPendingOnboarding: !account.password,
    exists: true,
  };
}

export default {
  createAccountForStaff,
  revokeAccount,
  toggleAccountStatus,
  sendResetLink,
  getAccountStatus,
};

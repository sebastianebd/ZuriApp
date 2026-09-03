import Role, { IRole } from '../models/role.model';
import auditService from './audit.service';
import { AUDIT_MODULES } from '../constants/audit.constants';

/**
 * Crea un nuevo Rol validando las reglas de acceso al sistema.
 */
async function createRole(payload: Partial<IRole>, reqAccount: any): Promise<IRole> {
  if (payload.hasSystemAccess === true && (!payload.permissions || payload.permissions.length === 0)) {
    throw new Error('Roles with system access must have at least 1 permission');
  }

  const role = await Role.create(payload);

  await auditService.logAction(
    'CREAR',
    AUDIT_MODULES.ROLES,
    reqAccount,
    `Se creó el Rol "${role.name}"`,
    null,
    role._id as string
  );

  return role;
}

/**
 * Actualiza un Rol existente, forzando la inmutabilidad de hasSystemAccess.
 */
async function updateRole(roleId: string, updatePayload: Partial<IRole>, reqAccount: any): Promise<IRole | null> {
  const existingRole = await Role.findById(roleId);
  
  if (!existingRole) {
    throw new Error('Role not found');
  }

  // Fuerza la inmutabilidad de hasSystemAccess
  if (updatePayload.hasSystemAccess !== undefined && updatePayload.hasSystemAccess !== existingRole.hasSystemAccess) {
    throw new Error('The field hasSystemAccess is immutable and cannot be changed after creation');
  }

  const oldData = existingRole.toObject();
  Object.assign(existingRole, updatePayload);
  await existingRole.save();
  
  const diff = auditService.generateDiff(oldData, existingRole.toObject(), "Role");
  const descripcion = diff
      ? `Se actualizó el Rol "${existingRole.name}" (Cambios detectados)`
      : `Se actualizó el Rol "${existingRole.name}" (Sin cambios detectados)`;

  await auditService.logAction(
    'MODIFICAR',
    AUDIT_MODULES.ROLES,
    reqAccount,
    descripcion,
    diff,
    existingRole._id as string
  );

  return existingRole;
}

/**
 * Obtiene todos los roles activos (no eliminados)
 */
async function getRoles(): Promise<IRole[]> {
  return await Role.find({ deleted_at: null });
}

/**
 * Realiza un Soft Delete de un Rol
 */
async function deleteRole(roleId: string, reqAccount: any): Promise<IRole | null> {
  const existingRole = await Role.findById(roleId);
  
  if (!existingRole) {
    throw new Error('Role not found');
  }

  if (existingRole.level === 100) {
    throw new Error('Cannot delete the main system role (Level 100)');
  }

  existingRole.deleted_at = new Date();
  await existingRole.save();

  await auditService.logAction(
    'ELIMINAR',
    AUDIT_MODULES.ROLES,
    reqAccount,
    `Se eliminó el Rol "${existingRole.name}"`,
    null,
    existingRole._id as string
  );

  return existingRole;
}

export default {
  createRole,
  updateRole,
  getRoles,
  deleteRole,
};

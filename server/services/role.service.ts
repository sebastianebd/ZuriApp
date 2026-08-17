import Role, { IRole } from '../models/role.model';

/**
 * Crea un nuevo Rol validando las reglas de acceso al sistema.
 */
async function createRole(payload: Partial<IRole>): Promise<IRole> {
  if (payload.hasSystemAccess === true && (!payload.permissions || payload.permissions.length === 0)) {
    throw new Error('Roles with system access must have at least 1 permission');
  }

  return await Role.create(payload);
}

/**
 * Actualiza un Rol existente, forzando la inmutabilidad de hasSystemAccess.
 */
async function updateRole(roleId: string, updatePayload: Partial<IRole>): Promise<IRole | null> {
  const existingRole = await Role.findById(roleId);
  
  if (!existingRole) {
    throw new Error('Role not found');
  }

  // Fuerza la inmutabilidad de hasSystemAccess
  if (updatePayload.hasSystemAccess !== undefined && updatePayload.hasSystemAccess !== existingRole.hasSystemAccess) {
    throw new Error('The field hasSystemAccess is immutable and cannot be changed after creation');
  }

  Object.assign(existingRole, updatePayload);
  await existingRole.save();
  
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
async function deleteRole(roleId: string): Promise<IRole | null> {
  const existingRole = await Role.findById(roleId);
  
  if (!existingRole) {
    throw new Error('Role not found');
  }

  if (existingRole.level === 100) {
    throw new Error('Cannot delete the main system role (Level 100)');
  }

  existingRole.deleted_at = new Date();
  await existingRole.save();
  return existingRole;
}

export default {
  createRole,
  updateRole,
  getRoles,
  deleteRole,
};

import Position from "../models/position.model";
import auditService from './audit.service';
import { AUDIT_MODULES } from '../constants/audit.constants';

/**
 * Servicio para gestionar los Cargos del personal.
 */

async function getPositions() {
  return await Position.find({ deleted_at: null });
}

async function createPosition(payload: any, reqAccount: any) {
  const position = await Position.create(payload);
  
  await auditService.logAction(
    'CREAR',
    AUDIT_MODULES.ROLES,
    reqAccount,
    `Se creó el Cargo "${position.name}"`,
    null,
    position._id as string
  );

  return position;
}

async function updatePosition(id: string, payload: any, reqAccount: any) {
  const position = await Position.findById(id);
  if (!position) {
    throw new Error('Position not found');
  }
  const oldData = position.toObject();
  Object.assign(position, payload);
  await position.save();

  const diff = auditService.generateDiff(oldData, position.toObject(), "Position");
  const descripcion = diff
      ? `Se actualizó el Cargo "${position.name}" (Cambios detectados)`
      : `Se actualizó el Cargo "${position.name}" (Sin cambios detectados)`;

  await auditService.logAction(
    'MODIFICAR',
    AUDIT_MODULES.ROLES,
    reqAccount,
    descripcion,
    diff,
    position._id as string
  );

  return position;
}

async function deletePosition(id: string, reqAccount: any) {
  const position = await Position.findById(id);
  if (!position) {
    throw new Error('Position not found');
  }
  position.deleted_at = new Date();
  await position.save();

  await auditService.logAction(
    'ELIMINAR',
    AUDIT_MODULES.ROLES,
    reqAccount,
    `Se eliminó el Cargo "${position.name}"`,
    null,
    position._id as string
  );

  return position;
}

export default {
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
};

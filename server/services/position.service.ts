import Position from "../models/position.model";

/**
 * Servicio para gestionar los Cargos del personal.
 */

async function getPositions() {
  return await Position.find({ deleted_at: null });
}

async function createPosition(payload: any) {
  return await Position.create(payload);
}

async function updatePosition(id: string, payload: any) {
  const position = await Position.findById(id);
  if (!position) {
    throw new Error('Position not found');
  }
  Object.assign(position, payload);
  await position.save();
  return position;
}

async function deletePosition(id: string) {
  const position = await Position.findById(id);
  if (!position) {
    throw new Error('Position not found');
  }
  position.deleted_at = new Date();
  await position.save();
  return position;
}

export default {
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
};

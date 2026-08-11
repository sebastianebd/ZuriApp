import Position from "../models/position.model";

/**
 * Servicio para gestionar los Cargos del personal.
 */

async function getPositions() {
  return await Position.find({ isActive: true });
}

export default {
  getPositions,
};

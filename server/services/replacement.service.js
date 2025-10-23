const Reemplazo = require('../models/replacement.model');

async function registrar(data) {
  await Reemplazo.create(data);
}

async function obtenerActivos() {
  return await Reemplazo.find({ eliminado: false, activo: true });
}

async function obtenerInactivos() {
  return await Reemplazo.find({ eliminado: false, activo: false });
}

async function actualizar(id, data) {
  await Reemplazo.findByIdAndUpdate(id, data, { new: true });
  return await Reemplazo.find();
}

async function eliminar(id) {
  await Reemplazo.findByIdAndUpdate(id, { eliminado: true, activo: false });
  return await Reemplazo.find({ eliminado: { $ne: true } });
}

module.exports = { registrar, obtenerActivos, obtenerInactivos, actualizar, eliminar };

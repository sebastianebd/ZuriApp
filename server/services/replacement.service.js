const Reemplazo = require('../models/replacement.model');

async function registrar(data) {
  // 1. Crear una nueva instancia (documento) de Mongoose
  const nuevoReemplazo = new Reemplazo(data);
  await nuevoReemplazo.save();
}

async function obtenerActivos() {
  return await Reemplazo.find({ anulado: false, activo: true });
}

async function obtenerInactivos() {
  return await Reemplazo.find({ activo: false });
}

async function actualizar(id, data) {
  await Reemplazo.findByIdAndUpdate(id, data, { new: true });
  return await Reemplazo.find();
}

async function eliminar(id) {
  await Reemplazo.findByIdAndUpdate(id, { anulado: true, activo: false });
  return await Reemplazo.find();
}

async function obtenerHistorialUsuario(id) {
  return await Reemplazo.find({
    $or: [{ id_entrante: id }, { id_saliente: id }]
  });
}

module.exports = { registrar, obtenerActivos, obtenerInactivos, actualizar, eliminar, obtenerHistorialUsuario };

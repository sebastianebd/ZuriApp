const Reemplazo = require('../models/replacement.model');

async function registrar(data) {
  // 1. Crear una nueva instancia (documento) de Mongoose
  const nuevoReemplazo = new Reemplazo(data);
  await nuevoReemplazo.save();
  console.log('✅ Reemplazo creado', nuevoReemplazo);
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

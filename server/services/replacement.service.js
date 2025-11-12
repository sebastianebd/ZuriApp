const Reemplazo = require('../models/replacement.model');

async function registrar(data) {
  // 1. Crear una nueva instancia (documento) de Mongoose
  const nuevoReemplazo = new Reemplazo(data);
  await nuevoReemplazo.save();
}

async function obtenerActivos() {
  return await Reemplazo.find({ status:{ $in: ['EN CURSO' , 'PENDIENTE'] }})
}

async function obtenerInactivos() {
  return await Reemplazo.find({ status: { $in: ['FINALIZADO' , 'ANULADO' , 'INTERRUMPIDO'] }})
}

async function actualizar(id, data) {
  await Reemplazo.findByIdAndUpdate(id, data, { new: true });
  return await Reemplazo.find();
}

//FUNCION DEBERÍA LLAMARSE anularReemplazo
async function eliminar(id) {
  await Reemplazo.findByIdAndUpdate(id, { status: 'ANULADO' });
  return await Reemplazo.find();
}

async function obtenerHistorialUsuario(id) {
  return await Reemplazo.find({
    $or: [{ id_entrante: id }, { id_saliente: id }]
  });
}

module.exports = { registrar, obtenerActivos, obtenerInactivos, actualizar, eliminar, obtenerHistorialUsuario };

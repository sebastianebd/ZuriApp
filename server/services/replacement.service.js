const Reemplazo = require("../models/replacement.model");

const determineStatus = (fecha_inicio) => {
  const now = new Date();
  const fechaActualUTC = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );

  const inicio = new Date(fecha_inicio);

  if (inicio.getTime() <= fechaActualUTC.getTime()) {
    return "EN CURSO";
  }

  return "PENDIENTE";
};

async function registrar(data) {
  const initialStatus = determineStatus(data.fecha_inicio);

  const nuevoReemplazo = new Reemplazo({
    ...data,
    fecha_inicio: new Date(data.fecha_inicio),
    fecha_termino: new Date(data.fecha_termino),
    status: initialStatus,
  });

  return await nuevoReemplazo.save();
}

async function obtenerActivos() {
  return await Reemplazo.find({ status: { $in: ["EN CURSO", "PENDIENTE"] } });
}

async function obtenerInactivos() {
  return await Reemplazo.find({
    status: { $in: ["FINALIZADO", "ANULADO", "INTERRUMPIDO"] },
  });
}

async function actualizar(id, data) {
  // Implementar lógica de determinar estado aquí también si se actualizan las fechas
  await Reemplazo.findByIdAndUpdate(id, data, { new: true });
  return await Reemplazo.find();
}

//FUNCION DEBERÍA LLAMARSE anularReemplazo
async function eliminar(id) {
  await Reemplazo.findByIdAndUpdate(id, { status: "ANULADO" });
  return await Reemplazo.find();
}

async function obtenerHistorialUsuario(id) {
  return await Reemplazo.find({
    $or: [{ id_entrante: id }, { id_saliente: id }],
  });
}

module.exports = {
  registrar,
  obtenerActivos,
  obtenerInactivos,
  actualizar,
  eliminar,
  obtenerHistorialUsuario,
};

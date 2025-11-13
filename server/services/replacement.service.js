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

const determineStatusCorte = (fecha_corte) => {
  const now = new Date();
  const fechaActualUTC = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );

  const fechaCorte = new Date(fecha_corte);

  if (fechaCorte.getTime() < fechaActualUTC.getTime()) {
    return "INTERRUMPIDO";
  }
  return "EN CURSO";
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
  return await Reemplazo.find({
    status: { $in: ["EN CURSO", "PENDIENTE"] },
  }).populate("creado_por", "nombre apellido");
}

async function obtenerInactivos() {
  return await Reemplazo.find({
    status: { $in: ["FINALIZADO", "ANULADO", "INTERRUMPIDO"] },
  });
}

async function actualizar(id, data) {
  // Implementar lógica de determinar estado aquí también
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

const getNextDay = (dateString) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

// Nueva función de Sustitución
async function sustituir(payload) {
  const { id_registro_a, fecha_corte_a, nuevo_entrante, datos_base_evento } =
    payload;
  console.log(payload);
  if (
    !id_registro_a ||
    !fecha_corte_a ||
    !nuevo_entrante ||
    !datos_base_evento
  ) {
    throw new Error("Faltan datos esenciales para la sustitución.");
  }
  const fechaCorteDate = new Date(fecha_corte_a);

  const registroA_actualizado = await Reemplazo.findByIdAndUpdate(
    id_registro_a,
    {
      fecha_termino: fechaCorteDate,
      status: determineStatusCorte(fecha_corte_a),
      corte_anticipado: true,
      updated_at: new Date(),
    },
    { new: true }
  );
  if (!registroA_actualizado) {
    throw new Error(
      `Registro de reemplazo con ID ${id_registro_a} no encontrado.`
    );
  }

  const fechaInicioB = getNextDay(fecha_corte_a);
  const datosNuevoReemplazo = {
    id_negocio: datos_base_evento.id_evento_principal,
    id_saliente: datos_base_evento.id_saliente,
    rut_saliente: datos_base_evento.rut_saliente,
    nombre_saliente: datos_base_evento.nombre_saliente,
    apellido_saliente: datos_base_evento.apellido_saliente,
    tipo_cargo: datos_base_evento.tipo_cargo,
    tipo_turno: datos_base_evento.tipo_turno,
    servicio: datos_base_evento.servicio,
    id_entrante: nuevo_entrante.id_entrante,
    rut_entrante: nuevo_entrante.rut_entrante,
    nombre_entrante: nuevo_entrante.nombre_entrante,
    apellido_entrante: nuevo_entrante.apellido_entrante,
    fecha_inicio: new Date(fechaInicioB),
    fecha_termino: new Date(datos_base_evento.fecha_termino_original),
    status: determineStatus(fechaInicioB),
    creado_por: registroA_actualizado.creado_por,
  };
  if (!datosNuevoReemplazo.id_entrante) {
    throw new Error("El nuevo funcionario entrante es requerido.");
  }

  const nuevoReemplazoB = new Reemplazo(datosNuevoReemplazo);
  const registroB_guardado = await nuevoReemplazoB.save();

  return [registroA_actualizado, registroB_guardado];
}

module.exports = {
  registrar,
  obtenerActivos,
  obtenerInactivos,
  actualizar,
  eliminar,
  obtenerHistorialUsuario,
  sustituir,
};

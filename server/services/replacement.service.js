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

// Función auxiliar para obtener el día siguiente
const getNextDay = (dateString) => {
  const date = new Date(dateString); // Sumar un día
  date.setDate(date.getDate() + 1); // Formatear a 'YYYY-MM-DD' para ser consistente con el frontend (opcional)
  return date.toISOString().slice(0, 10);
};

// Nueva función de Sustitución
async function sustituir(payload) {
  const { id_registro_a, fecha_corte_a, nuevo_entrante, datos_base_evento } =
    payload; // VALIDACIÓN BÁSICA
  if (
    !id_registro_a ||
    !fecha_corte_a ||
    !nuevo_entrante ||
    !datos_base_evento
  ) {
    throw new Error("Faltan datos esenciales para la sustitución.");
  } // Paso 1: Cerrar/Interrumpir el Registro A // Convertir la fecha de corte a formato Date
  const fechaCorteDate = new Date(fecha_corte_a); // 1.1. Actualizar Registro A

  const registroA_actualizado = await Reemplazo.findByIdAndUpdate(
    id_registro_a,
    {
      fecha_termino: fechaCorteDate,
      status: "INTERRUMPIDO", // Cambiar el estado a INTERRUMPIDO
      updated_at: new Date(), // Actualizar el timestamp
    },
    { new: true }
  );
  if (!registroA_actualizado) {
    throw new Error(
      `Registro de reemplazo con ID ${id_registro_a} no encontrado.`
    );
  } // Paso 2: Crear el Nuevo Registro B (Sustitución) // La fecha de inicio del nuevo registro B es el día siguiente al corte de A

  const fechaInicioB = getNextDay(fecha_corte_a); // Usamos los datos heredados de A (datos_base_evento) y los nuevos datos del entrante (B)
  const datosNuevoReemplazo = {
    // Heredados del Registro A
    id_negocio: datos_base_evento.id_evento_principal, // Mantiene el mismo ID de Negocio
    id_saliente: datos_base_evento.id_saliente,
    rut_saliente: datos_base_evento.rut_saliente,
    nombre_saliente: datos_base_evento.nombre_saliente,
    apellido_saliente: datos_base_evento.apellido_saliente,
    tipo_cargo: datos_base_evento.tipo_cargo,
    tipo_turno: datos_base_evento.tipo_turno,
    servicio: datos_base_evento.servicio, // Nuevos datos del Entrante B (vienen de nuevo_entrante)
    id_entrante: nuevo_entrante.id_entrante, // Asume que el Frontend ya validó esto
    rut_entrante: nuevo_entrante.rut_entrante,
    nombre_entrante: nuevo_entrante.nombre_entrante,
    apellido_entrante: nuevo_entrante.apellido_entrante, // Fechas y Status
    fecha_inicio: new Date(fechaInicioB), // Día siguiente al corte
    fecha_termino: new Date(datos_base_evento.fecha_termino_original), // La fecha de término original de A
    status: determineStatus(fechaInicioB), // Determinar si está PENDIENTE o EN CURSO // Creado por
    creado_por: registroA_actualizado.creado_por, // Mantiene el mismo creador del primer registro
  }; // Validar que los campos requeridos estén presentes antes de crear (ej: id_entrante)
  if (!datosNuevoReemplazo.id_entrante) {
    throw new Error("El nuevo funcionario entrante es requerido.");
  }

  const nuevoReemplazoB = new Reemplazo(datosNuevoReemplazo);
  const registroB_guardado = await nuevoReemplazoB.save(); // ⬅️ Variable para el nuevo registro // 🔑 Cambio clave: Devolver ambos registros en un array

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

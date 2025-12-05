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

const fechaLocal = new Date();
fechaLocal.setMinutes(fechaLocal.getMinutes() - fechaLocal.getTimezoneOffset());

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

/**
 * Obtiene el historial de reemplazos inactivos con paginación y filtrado.
 * @param {object} filtros - Objeto con criterios de filtrado (ej: { rutSaliente: '123', servicio: 'Urgencias' })
 * @param {number} [pagina=1] - Número de página a cargar.
 * @param {number} [limite=10] - Cantidad máxima de registros por página.
 * @returns {Promise<object>} Un objeto con los registros y metadatos de paginación.
 */
async function obtenerInactivosPaginados(
  filtros = {},
  pagina = 1,
  limite = 10
) {
  // 1. Definición del Query Base (registros inactivos)
  const query = {
    status: { $in: ["FINALIZADO", "ANULADO", "INTERRUMPIDO"] },
  };

  // 2. Aplicación de Filtros Dinámicos
  // Nota: Los nombres de los filtros deben coincidir con los que envías desde el frontend.

  if (filtros.servicio) {
    query.servicio = filtros.servicio;
  }

  // Filtro por RUT Saliente (busca RUT que COMIENCE con el texto, Case-Insensitive 'i')
  if (filtros.rutSaliente) {
    query.rut_saliente = {
      $regex: new RegExp(`^${filtros.rutSaliente}`),
      $options: "i",
    };
  }

  // Filtro por RUT Entrante
  if (filtros.rutEntrante) {
    query.rut_entrante = {
      $regex: new RegExp(`^${filtros.rutEntrante}`),
      $options: "i",
    };
  }

  // Filtro por Fecha Inicio
  if (filtros.fechaInicio) {
    // En Mongoose, las fechas se comparan mejor usando $gte o $lte en un rango.
    // Si el usuario quiere ver solo registros que *comenzaron* en esa fecha:
    const fechaInicio = new Date(filtros.fechaInicio);
    const fechaFinDia = new Date(fechaInicio);
    fechaFinDia.setDate(fechaFinDia.getDate() + 1); // El día siguiente

    query.fecha_inicio = {
      $gte: fechaInicio, // Mayor o igual que el inicio del día
      $lt: fechaFinDia, // Menor estricto que el inicio del día siguiente
    };
  }

  // Filtro por Fecha Fin
  if (filtros.fechaFin) {
    // Si el usuario quiere ver solo registros que *terminaron* en esa fecha:
    const fechaTermino = new Date(filtros.fechaFin);
    const fechaFinDia = new Date(fechaTermino);
    fechaFinDia.setDate(fechaFinDia.getDate() + 1);

    query.fecha_termino = {
      $gte: fechaTermino,
      $lt: fechaFinDia,
    };
  }

  // 3. Cálculo del OFFSET (Cuántos registros saltar)
  const skip = (pagina - 1) * limite;

  // 4. Ejecución de Consultas Concurrentes
  const [registros, totalRegistros] = await Promise.all([
    // Consulta A: Obtener los datos de la página
    Reemplazo.find(query)
      .populate("creado_por", "nombre apellido")
      .sort({ fecha_inicio: -1 }) // Ordenar descendente
      .skip(skip)
      .limit(limite)
      .exec(),

    // Consulta B: Obtener el conteo total de documentos que cumplen el filtro
    Reemplazo.countDocuments(query),
  ]);

  // 5. Devolver Resultados con Metadatos
  return {
    registros,
    totalRegistros,
    paginaActual: pagina,
    limite,
    totalPages: Math.ceil(totalRegistros / limite),
  };
}

async function actualizar(id, data) {
  // Implementar lógica de determinar estado aquí también
  await Reemplazo.findByIdAndUpdate(id, data, { new: true });
  return await Reemplazo.findById(id);
}

//FUNCION DEBERÍA LLAMARSE finalizarReemplazo
async function finalizarReemplazo(id) {
  await Reemplazo.findByIdAndUpdate(
    id,
    { status: "FINALIZADO", fecha_termino: fechaLocal },
    { new: true }
  );
  return await Reemplazo.findById(id);
}

async function anularReemplazo(id) {
  await Reemplazo.findByIdAndUpdate(id, { status: "ANULADO" });
  return await Reemplazo.findById(id);
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
  actualizar,
  finalizarReemplazo,
  anularReemplazo,
  obtenerHistorialUsuario,
  sustituir,
  obtenerInactivosPaginados,
};

import Reemplazo, { IReplacement } from "../models/replacement.model";

const determineStatus = (fecha_inicio: Date | string): string => {
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

const determineStatusCorte = (fecha_corte: Date | string): string => {
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

async function registrar(data: any) {
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

async function obtenerInactivosPaginados(
  filtros: any = {},
  pagina: number = 1,
  limite: number = 10
) {
  const query: any = {
    status: { $in: ["FINALIZADO", "ANULADO", "INTERRUMPIDO"] },
  };

  if (filtros.servicio) {
    query.servicio = filtros.servicio;
  }

  if (filtros.rutSaliente) {
    query.rut_saliente = {
      $regex: new RegExp(`^${filtros.rutSaliente}`),
      $options: "i",
    };
  }

  if (filtros.rutEntrante) {
    query.rut_entrante = {
      $regex: new RegExp(`^${filtros.rutEntrante}`),
      $options: "i",
    };
  }

  if (filtros.fechaInicio) {
    const fechaInicio = new Date(filtros.fechaInicio);
    const fechaFinDia = new Date(fechaInicio);
    fechaFinDia.setDate(fechaFinDia.getDate() + 1);

    query.fecha_inicio = {
      $gte: fechaInicio,
      $lt: fechaFinDia,
    };
  }

  if (filtros.fechaFin) {
    const fechaTermino = new Date(filtros.fechaFin);
    const fechaFinDia = new Date(fechaTermino);
    fechaFinDia.setDate(fechaFinDia.getDate() + 1);

    query.fecha_termino = {
      $gte: fechaTermino,
      $lt: fechaFinDia,
    };
  }

  const skip = (pagina - 1) * limite;

  const [registros, totalRegistros] = await Promise.all([
    Reemplazo.find(query)
      .populate("creado_por", "nombre apellido")
      .sort({ fecha_inicio: -1 })
      .skip(skip)
      .limit(limite)
      .exec(),

    Reemplazo.countDocuments(query),
  ]);

  return {
    registros,
    totalRegistros,
    paginaActual: Number(pagina),
    limite,
    totalPages: Math.ceil(totalRegistros / limite),
  };
}

async function obtenerPorId(id: string) {
  return await Reemplazo.findById(id).lean();
}

async function actualizar(id: string, data: any) {
  await Reemplazo.findByIdAndUpdate(id, data, { new: true });
  return await Reemplazo.findById(id);
}

async function finalizarReemplazo(id: string) {
  await Reemplazo.findByIdAndUpdate(
    id,
    { status: "FINALIZADO", fecha_termino: fechaLocal },
    { new: true }
  );
  return await Reemplazo.findById(id);
}

async function anularReemplazo(id: string) {
  await Reemplazo.findByIdAndUpdate(id, { status: "ANULADO" });
  return await Reemplazo.findById(id);
}

async function obtenerHistorialUsuario(id: string) {
  return await Reemplazo.find({
    $or: [{ id_entrante: id }, { id_saliente: id }],
  });
}

const getNextDay = (dateString: string | Date) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

interface SustitucionPayload {
  id_registro_a: string;
  fecha_corte_a: string;
  nuevo_entrante: {
    id_entrante: string;
    rut_entrante: string;
    nombre_entrante: string;
    apellido_entrante: string;
  };
  datos_base_evento: any;
}

async function sustituir(payload: SustitucionPayload) {
  const { id_registro_a, fecha_corte_a, nuevo_entrante, datos_base_evento } =
    payload;

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

export default {
  registrar,
  obtenerActivos,
  actualizar,
  finalizarReemplazo,
  anularReemplazo,
  obtenerHistorialUsuario,
  sustituir,
  obtenerInactivosPaginados,
  obtenerPorId,
};

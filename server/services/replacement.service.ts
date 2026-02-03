import Reemplazo, { IReplacement } from "../models/replacement.model";

const determineStatus = (fecha_inicio: Date | string): string => {
  const now = new Date();
  const fechaActualUTC = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
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
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );

  const fechaCorte = new Date(fecha_corte);

  if (fechaCorte.getTime() < fechaActualUTC.getTime()) {
    return "INTERRUMPIDO";
  }
  return "EN CURSO";
};

async function registrar(data: any) {
  const initialStatus = determineStatus(data.fecha_inicio);

  /* 
   Lookup TurnType ID 
   We import basic mongoose model to avoid large circular deps if possible, 
   or just use mongoose.model if registered.
   But let's use dynamic import or assume TurnType is registered.
  */
  const { default: TurnTypeModel } = await import("../models/turn-type.model");
  const turnTypeDoc = await TurnTypeModel.findOne({
    // match by name (case insensitive) or code?
    // Usually frontend sends name.
    nombre: { $regex: new RegExp(`^${data.tipo_turno}$`, "i") },
    deleted_at: null,
  });

  const nuevoReemplazo = new Reemplazo({
    ...data,
    turn_type_id: turnTypeDoc ? turnTypeDoc._id : undefined, // Save ID if found
    snapshot_secuencia: turnTypeDoc
      ? turnTypeDoc.toObject().secuencia.map((item: any) => {
          const { color, ...rest } = item;
          return rest;
        })
      : [],
    fecha_inicio: new Date(data.fecha_inicio),
    fecha_termino: new Date(data.fecha_termino),
    status: initialStatus,
  });

  return await nuevoReemplazo.save();
}

async function obtenerActivos() {
  return await Reemplazo.find({
    status: { $in: ["EN CURSO", "PENDIENTE"] },
  })
    .populate("creado_por", "nombre apellido")
    .populate("id_entrante", "tipo_cargo"); // Populate to get cargo
}

async function obtenerActivosPaginado(options: {
  search?: string;
  servicio?: string;
  page: number;
  limit: number;
}) {
  const { search, servicio, page, limit } = options;
  const query: any = {
    status: { $in: ["EN CURSO", "PENDIENTE"] },
  };

  // Service filter
  if (servicio && servicio.trim().length > 0) {
    query.servicio = servicio;
  }

  // Search Logic (optimized with indexes)
  if (search && search.trim().length > 0) {
    const safeTerm = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(safeTerm, "i");

    query.$or = [
      { rut_saliente: regex },
      { nombre_saliente: regex },
      { apellido_saliente: regex },
      { rut_entrante: regex },
      { nombre_entrante: regex },
      { apellido_entrante: regex },
    ];
  }

  // Calculate skip for pagination
  const skip = (page - 1) * limit;

  // Execute query and count in parallel for performance
  const [reemplazos, total] = await Promise.all([
    Reemplazo.find(query)
      .populate("creado_por", "nombre apellido")
      .populate("id_entrante", "_id tipo_cargo") // Explicitly get _id and cargo
      .skip(skip)
      .limit(limit)
      .lean(), // Convert to plain objects (faster)
    Reemplazo.countDocuments(query),
  ]);

  // 🔧 Debug: Verify populate worked
  if (reemplazos.length > 0) {
    console.log(
      `[Replacement Service] Query returned ${reemplazos.length} replacements`,
    );
    console.log(
      `[Replacement Service] First replacement id_entrante:`,
      reemplazos[0].id_entrante,
    );
  }

  return {
    reemplazos,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
    },
  };
}

async function obtenerInactivosPaginados(
  filtros: any = {},
  pagina: number = 1,
  limite: number = 10,
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
  // Adjust to Chile Time (approx -3h) to ensure date falls on the correct local day
  // This effectively stores "Local Time" as UTC, which matches the user's legacy data expectation likely.
  const now = new Date();
  const chileOffset = 3 * 60 * 60 * 1000;
  const fechaCierre = new Date(now.getTime() - chileOffset);

  await Reemplazo.findByIdAndUpdate(
    id,
    { status: "FINALIZADO", fecha_termino: fechaCierre },
    { new: true },
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
    { new: true },
  );
  if (!registroA_actualizado) {
    throw new Error(
      `Registro de reemplazo con ID ${id_registro_a} no encontrado.`,
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
  obtenerActivosPaginado,
  actualizar,
  finalizarReemplazo,
  anularReemplazo,
  obtenerHistorialUsuario,
  sustituir,
  obtenerInactivosPaginados,
  obtenerPorId,
};

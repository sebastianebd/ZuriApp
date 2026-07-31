import Reemplazo, { IReplacement } from "../models/replacement.model";
import mongoose from "mongoose";
import { escapeRegex } from "../utils/regex";

// --- Helpers de Estado ---
// Determinamos el estado inicial basado puramente en fecha vs ahora.
// Esto mejora la UX al mostrar inmediatamente si un turno es "futuro" o "activo".
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
   Resolución de Tipo de Turno:
   Importamos dinámicamente el modelo para evitar dependencias circulares si existieran.
   Buscamos el TurnType para "congelar" su configuración (secuencia) en el momento de la creación.
   Esto es crucial: Si el admin cambia la definición del turno "Largo" en el futuro, 
   este reemplazo histórico NO debe cambiar, debe preservar la secuencia original (Snapshot Pattern).
  */
  const { default: TurnTypeModel } = await import("../models/turn-type.model");
  const turnTypeDoc = await TurnTypeModel.findOne({
    nombre: { $regex: new RegExp(`^${data.tipo_turno}$`, "i") },
    deleted_at: null,
  });

  const nuevoReemplazo = new Reemplazo({
    ...data,
    turn_type_id: turnTypeDoc ? turnTypeDoc._id : undefined,
    snapshot_secuencia: turnTypeDoc
      ? turnTypeDoc.toObject().secuencia.map((item: any) => {
          const { color, ...rest } = item;
          return rest; // Solo guardamos la lógica de turnos, el color puede ser cosmético
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
    .populate("id_entrante", "tipo_cargo");
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

  if (servicio && servicio.trim().length > 0) {
    query.servicio = servicio;
  }

  // Búsqueda Optimizada:
  // Utilizamos Regex con escape seguro para búsqueda parcial case-insensitive en múltiples campos.
  // Nota: Para alto volumen, considerar índice de texto en MongoDB (Atlas Search).
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

  const skip = (page - 1) * limit;

  // Ejecución Paralela: Data + Conteo Total
  const [reemplazos, total] = await Promise.all([
    Reemplazo.find(query)
      .populate("creado_por", "nombre apellido")
      .populate("id_entrante", "_id tipo_cargo")
      .skip(skip)
      .limit(limit)
      .lean(),
    Reemplazo.countDocuments(query),
  ]);

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
    // C1 ReDoS fix: escape user input before building RegExp
    query.rut_saliente = {
      $regex: new RegExp(`^${escapeRegex(filtros.rutSaliente)}`),
      $options: "i",
    };
  }

  if (filtros.rutEntrante) {
    // C1 ReDoS fix: escape user input before building RegExp
    query.rut_entrante = {
      $regex: new RegExp(`^${escapeRegex(filtros.rutEntrante)}`),
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
  // C4 Timezone fix: store plain UTC (new Date()). The hardcoded Chile offset
  // was wrong — Chile switches between UTC-3 and UTC-4 seasonally.
  // The frontend already formats dates with { timeZone: "America/Santiago" }.
  await Reemplazo.findByIdAndUpdate(
    id,
    { status: "FINALIZADO", fecha_termino: new Date() },
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

// Lógica de Negocio: Sustitución de Reemplazo
// C3 Transaction fix: ambas escrituras (cerrar A, crear B) se ejecutan dentro de una
// transacción Mongoose. Si B falla, el cierre de A se revierte automáticamente.
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
  const fechaInicioB = getNextDay(fecha_corte_a);

  // ponytail: capture results in outer scope — withTransaction() return type
  // is undefined in Mongoose typings so we can't rely on its return value.
  let registroA: any;
  let registroB: any;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // 1. Cerrar Registro A
      registroA = await Reemplazo.findByIdAndUpdate(
        id_registro_a,
        {
          fecha_termino: fechaCorteDate,
          status: determineStatusCorte(fecha_corte_a),
          corte_anticipado: true,
          updated_at: new Date(),
        },
        { new: true, session },
      );
      if (!registroA) {
        throw new Error(
          `Registro de reemplazo con ID ${id_registro_a} no encontrado.`,
        );
      }

      // 2. Crear Registro B (Continuidad)
      // El nuevo reemplazo comienza al día siguiente del corte.
      if (!nuevo_entrante.id_entrante) {
        throw new Error("El nuevo funcionario entrante es requerido.");
      }

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
        creado_por: registroA.creado_por,
      };

      const nuevoReemplazoDoc = new Reemplazo(datosNuevoReemplazo);
      registroB = await nuevoReemplazoDoc.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return [registroA, registroB];
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

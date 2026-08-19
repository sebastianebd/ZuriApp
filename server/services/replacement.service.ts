import Replacement, { IReplacement } from "../models/replacement.model";
import mongoose from "mongoose";
import { escapeRegex } from "../utils/regex";
import { get, set, delPattern } from "../config/redis.config";
import socketService from "../services/socket.service";

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

async function registrar(data: Partial<IReplacement>) {
  const initialStatus = determineStatus(data.fecha_inicio as Date | string);

  /* 
   Resolución de Tipo de Turno:
   Importamos dinámicamente el modelo para evitar dependencias circulares si existieran.
   Buscamos el TurnType para "congelar" su configuración (secuencia) en el momento de la creación.
   Esto es crucial: Si el admin cambia la definición del turno "Largo" en el futuro, 
   este reemplazo histórico NO debe cambiar, debe preservar la secuencia original (Snapshot Pattern).
  */
  const { default: TurnTypeModel } = await import("../models/turn-type.model");
  const turnTypeDoc = await TurnTypeModel.findOne({
    nombre: {
      $regex: new RegExp(`^${escapeRegex(data.tipo_turno || "")}$`, "i"),
    },
    deleted_at: null,
  });

  const nuevoReemplazo = new Replacement({
    ...data,
    turn_type_id: turnTypeDoc ? turnTypeDoc._id : undefined,
    snapshot_secuencia: turnTypeDoc
      ? turnTypeDoc.toObject().secuencia.map((item: any) => {
          const { color, ...rest } = item;
          return rest; // Solo guardamos la lógica de turnos, el color puede ser cosmético
        })
      : [],
    fecha_inicio: new Date(data.fecha_inicio!),
    fecha_termino: new Date(data.fecha_termino!),
    status: initialStatus,
  });

  const saved = await nuevoReemplazo.save();
  await delPattern("replacements:*");
  if (saved.id_entrante) {
    socketService.emitTurnUpdate(saved.id_entrante.toString());
  }
  return saved;
}

async function obtenerActivos() {
  return await Replacement.find({
    status: { $in: ["EN CURSO", "PENDIENTE"] },
  })
    .populate("creado_por", "firstName lastName")
    .populate("id_entrante", "positionId");
}

async function obtenerActivosPaginado(options: {
  search?: string;
  servicio?: string;
  fechaInicio?: string;
  fechaFin?: string;
  rutSaliente?: string;
  rutEntrante?: string;
  page: number;
  limit: number;
}) {
  const { search, servicio, fechaInicio, fechaFin, rutSaliente, rutEntrante, page, limit } = options;
  const query: any = {
    status: { $in: ["EN CURSO", "PENDIENTE"] },
  };

  if (servicio && servicio.trim().length > 0) {
    query.servicio = servicio;
  }

  // Date filters
  if (fechaInicio || fechaFin) {
    query.$and = query.$and || [];

    // Si hay fechaInicio, el reemplazo debe iniciar en o después de esta fecha
    if (fechaInicio) {
      query.$and.push({ fecha_inicio: { $gte: fechaInicio } });
    }

    // Si hay fechaFin, el reemplazo debe terminar en o antes de esta fecha
    if (fechaFin) {
      query.$and.push({ fecha_termino: { $lte: fechaFin } });
    }
  }

  // Lógica segura de inyección condicional de guion (Clean Path)
  if (rutSaliente) {
    const rawRut = rutSaliente.replace(/[^0-9kK]/gi, '');
    let regexStr = rawRut;
    if (rawRut.length > 1) {
      regexStr = rawRut.slice(0, -1) + '-?' + rawRut.slice(-1);
    }
    query.rut_saliente = new RegExp("^" + regexStr, "i");
  }

  if (rutEntrante) {
    const rawRut = rutEntrante.replace(/[^0-9kK]/gi, '');
    let regexStr = rawRut;
    if (rawRut.length > 1) {
      regexStr = rawRut.slice(0, -1) + '-?' + rawRut.slice(-1);
    }
    query.rut_entrante = new RegExp("^" + regexStr, "i");
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

  const cacheKey = `replacements:active:v2:p${page}:l${limit}:s${search || "none"}:serv${servicio || "none"}:fi${fechaInicio || "none"}:ff${fechaFin || "none"}:rs${rutSaliente || "none"}:re${rutEntrante || "none"}`;
  const cachedData = await get(cacheKey);
  if (cachedData) return cachedData;

  const skip = (page - 1) * limit;

  // Ejecución Paralela: Data + Conteo Total
  const [reemplazos, total] = await Promise.all([
    Replacement.find(query)
      .populate("creado_por", "firstName lastName")
      .populate({
        path: "id_entrante",
        select: "_id positionId firstName lastName rut",
        populate: { path: "positionId", select: "name" },
      })
      .skip(skip)
      .limit(limit)
      .lean(),
    Replacement.countDocuments(query),
  ]);

  const result = {
    reemplazos,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
    },
  };
  await set(cacheKey, result, 60);
  return result;
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
    const rawRut = filtros.rutSaliente.replace(/[^0-9kK]/gi, '');
    let regexStr = rawRut;
    if (rawRut.length > 1) {
      regexStr = rawRut.slice(0, -1) + '-?' + rawRut.slice(-1);
    }
    query.rut_saliente = {
      $regex: new RegExp(`^${regexStr}`),
      $options: "i",
    };
  }

  if (filtros.rutEntrante) {
    const rawRut = filtros.rutEntrante.replace(/[^0-9kK]/gi, '');
    let regexStr = rawRut;
    if (rawRut.length > 1) {
      regexStr = rawRut.slice(0, -1) + '-?' + rawRut.slice(-1);
    }
    query.rut_entrante = {
      $regex: new RegExp(`^${regexStr}`),
      $options: "i",
    };
  }

  if (filtros.fechaInicio || filtros.fechaFin) {
    query.$and = query.$and || [];

    // Si hay fechaInicio, el reemplazo debe iniciar en o después de esta fecha
    if (filtros.fechaInicio) {
      query.$and.push({ fecha_inicio: { $gte: filtros.fechaInicio } });
    }

    // Si hay fechaFin, el reemplazo debe terminar en o antes de esta fecha
    if (filtros.fechaFin) {
      query.$and.push({ fecha_termino: { $lte: filtros.fechaFin } });
    }
  }

  const sortedQuery = { ...filtros };
  const cacheKey = `replacements:history:paginated:${JSON.stringify(sortedQuery)}`;
  const cachedData = await get(cacheKey);
  if (cachedData) return cachedData;

  const skip = (pagina - 1) * limite;

  const [registros, totalRegistros] = await Promise.all([
    Replacement.find(query)
      .populate("creado_por", "firstName lastName")
      .sort({ fecha_inicio: -1 })
      .skip(skip)
      .limit(limite)
      .exec(),

    Replacement.countDocuments(query),
  ]);

  const result = {
    registros,
    totalRegistros,
    paginaActual: Number(pagina),
    limite,
    totalPages: Math.ceil(totalRegistros / limite),
  };
  await set(cacheKey, result, 60);
  return result;
}

async function obtenerPorId(id: string) {
  return await Replacement.findById(id).lean();
}

async function actualizar(id: string, data: Partial<IReplacement>) {
  if (data.tipo_turno) {
    const { default: TurnTypeModel } =
      await import("../models/turn-type.model");
    const turnTypeDoc = await TurnTypeModel.findOne({
      nombre: { $regex: new RegExp(`^${escapeRegex(data.tipo_turno)}$`, "i") },
      deleted_at: null,
    });

    if (!turnTypeDoc) {
      const error = new Error(
        `El turno '${data.tipo_turno}' no existe o está inactivo.`,
      );
      (error as any).status = 400;
      throw error;
    }

    data.turn_type_id = turnTypeDoc._id as any;
    data.snapshot_secuencia = turnTypeDoc
      .toObject()
      .secuencia.map((item: any) => {
        const { color, ...rest } = item;
        return rest;
      });
  }

  const updatedReplacement = await Replacement.findByIdAndUpdate(id, data, {
    new: true,
  });
  await delPattern("replacements:*");

  if (updatedReplacement && updatedReplacement.id_entrante) {
    socketService.emitTurnUpdate(updatedReplacement.id_entrante.toString());
  }

  return updatedReplacement;
}

async function finalizarReemplazo(id: string, fechaTermino?: string) {
  // C4 Timezone fix: store plain UTC (new Date()). The hardcoded Chile offset
  // was wrong — Chile switches between UTC-3 and UTC-4 seasonally.
  // The frontend already formats dates with { timeZone: "America/Santiago" }.
  const fecha = fechaTermino ? new Date(fechaTermino) : new Date();

  await Replacement.findByIdAndUpdate(
    id,
    { status: "FINALIZADO", fecha_termino: fecha },
    { new: true },
  );
  await delPattern("replacements:*");
  socketService.emitHistoryUpdate("finalize", id);
  return await Replacement.findById(id);
}

async function anularReemplazo(id: string) {
  await Replacement.findByIdAndUpdate(id, { status: "ANULADO" });
  await delPattern("replacements:*");
  socketService.emitHistoryUpdate("annul", id);
  return await Replacement.findById(id);
}

async function obtenerHistorialStaff(id: string) {
  const cacheKey = `replacements:user_history:${id}`;
  const cachedData = await get(cacheKey);
  if (cachedData) return cachedData;

  const data = await Replacement.find({
    $or: [{ id_entrante: id }, { id_saliente: id }],
  });
  await set(cacheKey, data, 300);
  return data;
}

export function getCleanBodyForDiff(body: any) {
  const validFields = Object.keys(Replacement.schema.paths);
  const cleanBody: any = {};
  Object.keys(body).forEach((key) => {
    if (validFields.includes(key)) {
      cleanBody[key] = body[key];
    }
  });
  return cleanBody;
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
      registroA = await Replacement.findByIdAndUpdate(
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

      const nuevoReemplazoDoc = new Replacement(datosNuevoReemplazo);
      registroB = await nuevoReemplazoDoc.save({ session });
    });
  } finally {
    await session.endSession();
  }

  if (registroA && registroB) {
    await delPattern("replacements:*");
    socketService.emitHistoryUpdate("substitute", registroA._id);
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
  obtenerHistorialStaff,
  sustituir,
  obtenerInactivosPaginados,
  obtenerPorId,
  getCleanBodyForDiff,
};

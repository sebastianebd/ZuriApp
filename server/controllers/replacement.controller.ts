import { Request, Response } from "express";
import replacementService from "../services/replacement.service";
import genericNotificationService from "../services/notification.service";
import auditService from "../services/audit.service";
import Reemplazo from "../models/replacement.model";
import { AuthRequest } from "../middleware/authentication.middleware";
import { get, set, delPattern } from "../config/redis.config";
import socketService from "../services/socket.service";
import { checkPeriodLock } from "../middleware/period-lock.middleware";

async function registerReemplazo(req: AuthRequest, res: Response) {
  try {
    // Verificación de Período Cerrado
    const { fecha_inicio, id_entrante } = req.body;
    if (fecha_inicio && id_entrante) {
      const d = new Date(fecha_inicio);
      const allowed = await checkPeriodLock(req, res, d.getMonth() + 1, d.getFullYear(), String(id_entrante));
      if (!allowed) return;
    }

    const nuevoReemplazo = await replacementService.registrar(req.body);

    // Auditoría Transaccional: Creación
    await auditService.logAction(
      "CREAR",
      "Reemplazos Activos",
      req.user,
      `Se creó un nuevo reemplazo ${nuevoReemplazo.id_negocio} para ${req.body.nombre_saliente} ${req.body.apellido_saliente}`,
      req.body,
      nuevoReemplazo._id as string,
    );

    // Auditoría de Efectos Colaterales (Turnos Implícitos)
    // Documentamos que el sistema generó turnos automáticamente para el entrante.
    await auditService.logAction(
      "CREAR",
      "Turnos Actuales",
      req.user,
      `Generación automática de turnos para ${req.body.nombre_entrante} ${req.body.apellido_entrante} (Reemplazo ${nuevoReemplazo.id_negocio})`,
      {
        start_date: req.body.fecha_inicio,
        end_date: req.body.fecha_termino,
        turn_type: req.body.tipo_turno
          ? req.body.tipo_turno
          : "Segun Reemplazo",
        replacement_id: nuevoReemplazo._id,
      },
      nuevoReemplazo._id as string,
    );

    await delPattern("replacements:*"); // Invalidación de Cache Radical (Broad Invalidation)

    // Notificación Asíncrona (WhatsApp)
    // Se ejecuta sin esperar confirmación para no bloquear la respuesta HTTP.
    await genericNotificationService.notifyReplacement(nuevoReemplazo);

    // Notificación Push al Frontend (Actualización en tiempo real)
    if (nuevoReemplazo.id_entrante) {
      socketService.emitTurnUpdate(nuevoReemplazo.id_entrante.toString());
    }

    res.sendStatus(201);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function mostrarReemplazos(req: Request, res: Response) {
  try {
    const hasPaginationParams = req.query.page || req.query.limit;

    // Configuración de Paginación
    const page = parseInt(req.query.page as string) || 1;
    // Fallback de límite alto para clientes legacy que no paginan
    const limit =
      parseInt(req.query.limit as string) || (hasPaginationParams ? 10 : 1000);
    const search = (req.query.search as string) || "";
    const servicio = (req.query.servicio as string) || "";

    // Key de Caché Compuesta
    // Incluye todos los parámetros de filtrado para evitar colisiones de caché.
    const cacheKey = `replacements:active:v2:p${page}:l${limit}:s${search || "none"}:serv${servicio || "none"}`;

    // 1. Intento de Caché (Read-Through)
    const cachedData = await get(cacheKey);
    if (cachedData) {
      console.log(`[Replacement Controller] Cache HIT for key: ${cacheKey}`);
      return res.json(cachedData);
    }

    console.log(`[Replacement Controller] Cache MISS for key: ${cacheKey}`);

    // 2. Fetch de Datos (Base de Datos)
    const result = await replacementService.obtenerActivosPaginado({
      search,
      servicio,
      page,
      limit,
    });

    // 3. Escritura en Caché (TTL Corto: 60s)
    // Dado que los reemplazos cambian frecuentemente, un TTL bajo minimiza la consistencia eventual.
    await set(cacheKey, result, 60);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ mensaje: error.message });
  }
}

async function mostrarHistorial(req: Request, res: Response) {
  try {
    const cacheKey = "replacements:history:all";
    const cachedData = await get(cacheKey);
    if (cachedData) return res.json(cachedData);

    const data = await replacementService.obtenerInactivosPaginados();
    await set(cacheKey, data, 300); // TTL Mayor (5 min) para datos históricos estáticos
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ mensaje: error.message });
  }
}

async function actualizarReemplazo(req: AuthRequest, res: Response) {
  try {
    const original: any = await replacementService.obtenerPorId(req.params.id);
    const data = await replacementService.actualizar(req.params.id, req.body);

    // Cálculo de Diferencias para Auditoría
    const validFields = Object.keys(Reemplazo.schema.paths);
    const cleanBody: any = {};
    Object.keys(req.body).forEach((key) => {
      if (validFields.includes(key)) {
        cleanBody[key] = req.body[key];
      }
    });

    const diff = auditService.generateDiff(original, cleanBody, "Replacement");
    const nombreReemplazo = original
      ? `${original.id_negocio} de ${original.nombre_saliente} ${original.apellido_saliente}`
      : `ID ${req.params.id}`;
    const descripcion = diff
      ? `Se modificó el reemplazo ${nombreReemplazo} (Cambios: ${diff})`
      : `Se modificó el reemplazo ${nombreReemplazo} (Sin cambios detectados)`;

    await auditService.logAction(
      "MODIFICAR",
      "Reemplazos Activos",
      req.user,
      descripcion,
      req.body,
      req.params.id,
    );
    await delPattern("replacements:*"); // Invalidate cache
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function finalizarReemplazo(req: AuthRequest, res: Response) {
  try {
    const original: any = await replacementService.obtenerPorId(req.params.id);
    const data = await replacementService.finalizarReemplazo(req.params.id);

    const nombreReemplazo = original
      ? `${original.id_negocio} para ${original.nombre_saliente} ${original.apellido_saliente}`
      : `ID ${req.params.id}`;

    await auditService.logAction(
      "FINALIZAR",
      "Reemplazos Activos",
      req.user,
      `Se finalizó el reemplazo ${nombreReemplazo}`,
      null,
      req.params.id,
    );
    await delPattern("replacements:*"); // Invalidate cache

    // Notificación WebSocket para actualizar clientes activos
    socketService.emitHistoryUpdate("finalize", req.params.id);

    res.json(data);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function anularReemplazo(req: AuthRequest, res: Response) {
  try {
    const original: any = await replacementService.obtenerPorId(req.params.id);
    const data = await replacementService.anularReemplazo(req.params.id);

    const nombreReemplazo = original
      ? `${original.id_negocio} para ${original.nombre_saliente} ${original.apellido_saliente}`
      : `ID ${req.params.id}`;

    await auditService.logAction(
      "ANULAR",
      "Reemplazos Activos",
      req.user,
      `Se anuló el reemplazo ${nombreReemplazo}`,
      null,
      req.params.id,
    );
    await delPattern("replacements:*"); // Invalidate cache

    // Socket: move to history
    socketService.emitHistoryUpdate("annul", req.params.id);

    res.json(data);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function obtenerHistorialUsuario(req: Request, res: Response) {
  try {
    // Caché por usuario específico (Granular)
    const cacheKey = `replacements:user_history:${req.params.id}`;
    const cachedData = await get(cacheKey);
    if (cachedData) return res.json(cachedData);

    const data = await replacementService.obtenerHistorialUsuario(
      req.params.id,
    );
    await set(cacheKey, data, 300);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function procesarSustitucion(req: AuthRequest, res: Response) {
  try {
    const resultado = await replacementService.sustituir(req.body);
    if (!resultado || !resultado[0] || !resultado[1]) {
      throw new Error("La sustitución no pudo completarse.");
    }
    const [registroA_cortado, nuevoRegistroB] = resultado;

    // Auditoría de Transacción Compleja
    // Registramos la sustitución después de que la operación de BD fue exitosa.
    await auditService.logAction(
      "SUSTITUCION",
      "Reemplazos Activos",
      req.user,
      `Se sustituyó el reemplazo: ${registroA_cortado.id_negocio} (Cambios: funcionario reemplazante: ${registroA_cortado.nombre_entrante} ${registroA_cortado.apellido_entrante} -> ${nuevoRegistroB.nombre_entrante} ${nuevoRegistroB.apellido_entrante})`,
      req.body,
      req.body.id_registro_a,
    );
    await delPattern("replacements:*");

    socketService.emitHistoryUpdate("substitute", registroA_cortado._id);

    res.status(200).json({
      mensaje: "Sustitución procesada exitosamente.",
      registro_anterior: registroA_cortado,
      nuevo_registro: nuevoRegistroB,
    });
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function mostrarHistorialPaginado(req: Request, res: Response) {
  try {
    const { pagina, limite, ...filtros } = req.query;

    // Generación determinista de clave de caché ordenando parámetros
    const sortedQuery = Object.keys(req.query)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = req.query[key];
        return acc;
      }, {});

    const cacheKey = `replacements:history:paginated:${JSON.stringify(
      sortedQuery,
    )}`;
    const paginaNum = parseInt(pagina as string) || 1;
    const limiteNum = parseInt(limite as string) || 10;

    const cachedData = await get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const data = await replacementService.obtenerInactivosPaginados(
      filtros,
      paginaNum,
      limiteNum,
    );

    await set(cacheKey, data, 60);

    res.json(data);
  } catch (error: any) {
    res.status(500).json({
      mensaje: error.message || "Error al cargar el historial paginado.",
    });
  }
}

export default {
  registerReemplazo,
  mostrarReemplazos,
  mostrarHistorial,
  actualizarReemplazo,
  finalizarReemplazo,
  anularReemplazo,
  obtenerHistorialUsuario,
  procesarSustitucion,
  mostrarHistorialPaginado,
};

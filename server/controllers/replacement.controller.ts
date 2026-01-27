import { Request, Response } from "express";
import replacementService from "../services/replacement.service";
import genericNotificationService from "../services/notification.service";
import auditService from "../services/audit.service";
import Reemplazo from "../models/replacement.model";
import { AuthRequest } from "../middleware/authentication.middleware";
import { get, set, delPattern } from "../config/redis.config";
import socketIO from "../config/socket";

async function registerReemplazo(req: AuthRequest, res: Response) {
  try {
    const nuevoReemplazo = await replacementService.registrar(req.body);

    // Log Auditoría
    await auditService.logAction(
      "CREAR",
      "Reemplazos Activos",
      req.user,
      `Se creó un nuevo reemplazo ${nuevoReemplazo.id_negocio} para ${req.body.nombre_saliente} ${req.body.apellido_saliente}`,
      req.body,
      nuevoReemplazo._id as string,
    );

    // Audit Implicit Shifts
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

    await delPattern("replacements:*"); // Invalidate cache

    // Send WhatsApp Notification (Enterprise Standard: Async / Non-blocking if performance critical, but safe to await here)
    await genericNotificationService.notifyReplacement(nuevoReemplazo);

    res.sendStatus(201);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function mostrarReemplazos(req: Request, res: Response) {
  try {
    // Check if pagination parameters are provided
    const hasPaginationParams = req.query.page || req.query.limit;

    // Pagination parameters (use high limit for legacy calls)
    const page = parseInt(req.query.page as string) || 1;
    const limit =
      parseInt(req.query.limit as string) || (hasPaginationParams ? 10 : 1000);
    const search = (req.query.search as string) || "";
    const servicio = (req.query.servicio as string) || "";

    // Generate unique cache key including pagination params
    // 🔧 v2: Added id_entrante populate
    const cacheKey = `replacements:active:v2:p${page}:l${limit}:s${search || "none"}:serv${servicio || "none"}`;

    // 1. Try Cache
    const cachedData = await get(cacheKey);
    if (cachedData) {
      console.log(`[Replacement Controller] Cache HIT for key: ${cacheKey}`);
      return res.json(cachedData);
    }

    console.log(`[Replacement Controller] Cache MISS for key: ${cacheKey}`);

    // 2. Fetch paginated data
    const result = await replacementService.obtenerActivosPaginado({
      search,
      servicio,
      page,
      limit,
    });

    // 🔧 Debug: Check if id_entrante is populated
    if (result.reemplazos && result.reemplazos.length > 0) {
      console.log(
        `[Replacement Controller] First replacement id_entrante:`,
        result.reemplazos[0].id_entrante,
      );
    }

    // 3. Cache result for 60 seconds
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
    await set(cacheKey, data, 300);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ mensaje: error.message });
  }
}

async function actualizarReemplazo(req: AuthRequest, res: Response) {
  try {
    const original: any = await replacementService.obtenerPorId(req.params.id);
    const data = await replacementService.actualizar(req.params.id, req.body);

    const validFields = Object.keys(Reemplazo.schema.paths);
    const cleanBody: any = {};
    Object.keys(req.body).forEach((key) => {
      if (validFields.includes(key)) {
        cleanBody[key] = req.body[key];
      }
    });

    const diff = auditService.generateDiff(original, cleanBody);
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

    // Emit socket event
    try {
      const io = socketIO.getIO();
      io.emit("history:update", { action: "finalize", id: req.params.id });
    } catch (err) {
      // Socket not ready, ignore
    }

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

    // Emit socket event
    try {
      const io = socketIO.getIO();
      io.emit("history:update", { action: "annul", id: req.params.id });
    } catch (err) {
      // Socket not ready, ignore
    }

    res.json(data);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function obtenerHistorialUsuario(req: Request, res: Response) {
  try {
    // This is user specific, maybe less critical to cache widely, but effective if user refreshes
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
    const [registroA_cortado, nuevoRegistroB] =
      await replacementService.sustituir(req.body);

    // Log Auditoría has to be before response or handled async, but here it was after response in original code.
    // I will keep it as is but add invalidation.
    // Wait, original code sent response THEN logged?
    // "res.status(200).json(...) ... await auditService.logAction(...)"
    // The await after response *might* not finish if serverless/lambda, but in node container it continues.
    // I should probably await before response or not await (fire and forget).
    // Original code:
    // res.status(200).json({...});
    // await auditService.logAction(...);
    //
    // I will add invalidation after logAction.

    // Actually, let's just do it slightly cleaner: await log, await invalidation, then respond.
    // Or keep original flow to not change latency?
    // If I change flow, I delay response.
    // I will put invalidation with logAction.

    await auditService.logAction(
      "SUSTITUCION",
      "Reemplazos Activos",
      req.user,
      `Se sustituyó el reemplazo: ${registroA_cortado.id_negocio} (Cambios: funcionario reemplazante: ${registroA_cortado.nombre_entrante} ${registroA_cortado.apellido_entrante} -> ${nuevoRegistroB.nombre_entrante} ${nuevoRegistroB.apellido_entrante})`,
      req.body,
      req.body.id_registro_a,
    );
    await delPattern("replacements:*");

    // Emit socket event
    try {
      const io = socketIO.getIO();
      io.emit("history:update", {
        action: "substitute",
        id: registroA_cortado._id,
      });
    } catch (err) {
      // Socket not ready, ignore
    }

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

    // Create a unique, deterministic cache key by sorting query parameters
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

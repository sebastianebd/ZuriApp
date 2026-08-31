import { Request, Response } from "express";
import replacementService from "../services/replacement.service";
import genericNotificationService from "../services/notification.service";
import auditService from "../services/audit.service";
import { AuthRequest } from "../middleware/authentication.middleware";
import { checkPeriodLock } from "../middleware/period-lock.middleware";

async function registerReemplazo(req: AuthRequest, res: Response) {
  try {
    // Verificación de Período Cerrado
    const { fecha_inicio, id_entrante } = req.body;
    if (fecha_inicio && id_entrante) {
      const d = new Date(fecha_inicio);
      const allowed = await checkPeriodLock(
        req,
        res,
        d.getMonth() + 1,
        d.getFullYear(),
        String(id_entrante),
      );
      if (!allowed) return;
    }

    const nuevoReemplazo = await replacementService.registrar(req.body);

    // Auditoría Transaccional: Creación
    await auditService.logAction(
      "CREAR",
      "Reemplazos Activos",
      req.account!,
      `Se creó un nuevo reemplazo ${nuevoReemplazo.id_negocio} para ${req.body.nombre_saliente} ${req.body.apellido_saliente}`,
      req.body,
      nuevoReemplazo._id as string,
    );

    // Auditoría de Efectos Colaterales (Turnos Implícitos)
    // Documentamos que el sistema generó turnos automáticamente para el entrante.
    await auditService.logAction(
      "CREAR",
      "Turnos Actuales",
      req.account!,
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

    // Notificación Asíncrona (WhatsApp)
    // Se ejecuta sin esperar confirmación para no bloquear la respuesta HTTP.
    await genericNotificationService.notifyReplacement(nuevoReemplazo);

    res.sendStatus(201);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 400;
    res
      .status(statusCode)
      .json({
        message: error.message || "Error al registrar reemplazo",
        error,
      });
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
    const fechaInicio = req.query.fechaInicio as string;
    const fechaFin = req.query.fechaFin as string;
    const rutSaliente = req.query.rutSaliente as string;
    const rutEntrante = req.query.rutEntrante as string;

    const result = await replacementService.obtenerActivosPaginado({
      search,
      servicio,
      fechaInicio,
      fechaFin,
      rutSaliente,
      rutEntrante,
      page,
      limit,
    });

    res.json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Error al mostrar reemplazos", error });
  }
}

async function obtenerReemplazosGrilla(req: Request, res: Response) {
  try {
    const servicio = (req.query.servicio as string) || "";
    const fechaInicio = req.query.fechaInicio as string;
    const fechaFin = req.query.fechaFin as string;

    const result = await replacementService.obtenerReemplazosGrilla({
      servicio,
      fechaInicio,
      fechaFin,
    });

    res.json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Error al obtener reemplazos para la grilla", error });
  }
}

async function mostrarHistorial(req: Request, res: Response) {
  try {
    const data = await replacementService.obtenerInactivosPaginados();
    res.json(data);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Error al mostrar historial", error });
  }
}

async function actualizarReemplazo(req: AuthRequest, res: Response) {
  try {
    const original: any = await replacementService.obtenerPorId(req.params.id);
    const data = await replacementService.actualizar(req.params.id, req.body);

    // Cálculo de Diferencias para Auditoría
    const cleanBody = replacementService.getCleanBodyForDiff(req.body);

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
      req.account!,
      descripcion,
      req.body,
      req.params.id,
    );
    res.json(data);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 400;
    res
      .status(statusCode)
      .json({
        message: error.message || "Error al actualizar reemplazo",
        error,
      });
  }
}

async function finalizarReemplazo(req: AuthRequest, res: Response) {
  try {
    const original: any = await replacementService.obtenerPorId(req.params.id);
    const fechaTermino = req.body.fecha_termino;
    const data = await replacementService.finalizarReemplazo(
      req.params.id,
      fechaTermino,
    );

    const nombreReemplazo = original
      ? `${original.id_negocio} para ${original.nombre_saliente} ${original.apellido_saliente}`
      : `ID ${req.params.id}`;

    await auditService.logAction(
      "FINALIZAR",
      "Reemplazos Activos",
      req.account!,
      `Se finalizó el reemplazo ${nombreReemplazo}`,
      null,
      req.params.id,
    );
    res.json(data);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 400;
    res
      .status(statusCode)
      .json({
        message: error.message || "Error al finalizar reemplazo",
        error,
      });
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
      req.account!,
      `Se anuló el reemplazo ${nombreReemplazo}`,
      null,
      req.params.id,
    );
    res.json(data);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 400;
    res
      .status(statusCode)
      .json({ message: error.message || "Error al anular reemplazo", error });
  }
}

async function obtenerHistorialStaff(req: Request, res: Response) {
  try {
    const data = await replacementService.obtenerHistorialStaff(req.params.id);
    res.json(data);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 400;
    res
      .status(statusCode)
      .json({ message: error.message || "Error al obtener historial", error });
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
      req.account!,
      `Se sustituyó el reemplazo: ${registroA_cortado.id_negocio} (Cambios: funcionario reemplazante: ${registroA_cortado.nombre_entrante} ${registroA_cortado.apellido_entrante} -> ${nuevoRegistroB.nombre_entrante} ${nuevoRegistroB.apellido_entrante})`,
      req.body,
      req.body.id_registro_a,
    );

    res.status(200).json({
      mensaje: "Sustitución procesada exitosamente.",
      registro_anterior: registroA_cortado,
      nuevo_registro: nuevoRegistroB,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 400;
    res
      .status(statusCode)
      .json({
        message: error.message || "Error al procesar sustitución",
        error,
      });
  }
}

async function mostrarHistorialPaginado(req: Request, res: Response) {
  try {
    const { pagina, limite, ...filtros } = req.query;

    const paginaNum = parseInt(pagina as string) || 1;
    const limiteNum = parseInt(limite as string) || 10;

    const data = await replacementService.obtenerInactivosPaginados(
      filtros,
      paginaNum,
      limiteNum,
    );

    res.json(data);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({
      message: error.message || "Error al cargar el historial paginado.",
      error,
    });
  }
}

export default {
  registerReemplazo,
  mostrarReemplazos,
  obtenerReemplazosGrilla,
  mostrarHistorial,
  actualizarReemplazo,
  finalizarReemplazo,
  anularReemplazo,
  obtenerHistorialStaff,
  procesarSustitucion,
  mostrarHistorialPaginado,
};

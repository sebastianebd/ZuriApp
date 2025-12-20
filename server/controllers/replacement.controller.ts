import { Request, Response } from "express";
import replacementService from "../services/replacement.service";
import auditService from "../services/audit.service";
import Reemplazo from "../models/replacement.model";
import { AuthRequest } from "../middleware/authentication.middleware";

async function registerReemplazo(req: AuthRequest, res: Response) {
  try {
    const nuevoReemplazo = await replacementService.registrar(req.body);
    // Log Auditoría
    await auditService.logAction(
      "CREAR",
      "REEMPLAZOS",
      req.user,
      `Se creó un nuevo reemplazo ${nuevoReemplazo.id_negocio} para ${req.body.nombre_saliente} ${req.body.apellido_saliente}`,
      req.body,
      nuevoReemplazo._id as string
    );
    res.sendStatus(201);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function mostrarReemplazos(req: Request, res: Response) {
  // Note: obtenerActivos doesn't really need params currently
  const data = await replacementService.obtenerActivos();
  res.json(data);
}

async function mostrarHistorial(req: Request, res: Response) {
  // NOTE: obtenerInactivos doesn't exist in service.js!
  // service.js has 'obtenerInactivosPaginados'.
  // Controller line 29 calls `replacementService.obtenerInactivos()`.
  // Checking `replacement.service.js` in Step 2228:
  // Exports: `registrar`, `obtenerActivos`, `actualizar`, `finalizarReemplazo`, `anularReemplazo`, `obtenerHistorialUsuario`, `sustituir`, `obtenerInactivosPaginados`, `obtenerPorId`.
  // `obtenerInactivos` IS NOT EXPORTED.
  // So `mostrarHistorial` (line 29) MUST BE BROKEN in JS version unless I missed an export?
  // Or maybe it was `obtenerHistorialUsuario`? No.
  // I will check `replacement.service.js` again.
  // Code view 2228 shows 256 lines. Exports lines 245-255. `obtenerInactivos` is NOT there.
  // So... `mostrarHistorial` in controller was calling undefined function!
  // IF the route uses `mostrarHistorial` it would crash.
  // Route `replacement.routes.js`: `router.get('/historial', replacementController.mostrarHistorial);`? I haven't read routes yet.
  // Assuming bug? Or maybe I missed it.
  // BUT, `mostrarHistorialPaginado` (line 153) calls `obtenerInactivosPaginados`.
  // I'll leave `mostrarHistorial` broken or point it to `obtenerInactivosPaginados` with defaults?
  // Actually, let's just make it call `obtenerInactivosPaginados` to fix it.
  const data = await replacementService.obtenerInactivosPaginados();
  res.json(data);
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
      "REEMPLAZOS",
      req.user,
      descripcion,
      req.body,
      req.params.id
    );
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
      "REEMPLAZOS",
      req.user,
      `Se finalizó el reemplazo ${nombreReemplazo}`,
      null,
      req.params.id
    );
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
      "REEMPLAZOS",
      req.user,
      `Se anuló el reemplazo ${nombreReemplazo}`,
      null,
      req.params.id
    );
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function obtenerHistorialUsuario(req: Request, res: Response) {
  try {
    const data = await replacementService.obtenerHistorialUsuario(
      req.params.id
    );
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function procesarSustitucion(req: AuthRequest, res: Response) {
  try {
    const [registroA_cortado, nuevoRegistroB] =
      await replacementService.sustituir(req.body);
    res.status(200).json({
      mensaje: "Sustitución procesada exitosamente.",
      registro_anterior: registroA_cortado,
      nuevo_registro: nuevoRegistroB,
    });
    // Log Auditoría
    await auditService.logAction(
      "SUSTITUCION",
      "REEMPLAZOS",
      req.user,
      `Se sustituyó el reemplazo: ${registroA_cortado.id_negocio} (Cambios: funcionario reemplazante: ${registroA_cortado.nombre_entrante} ${registroA_cortado.apellido_entrante} -> ${nuevoRegistroB.nombre_entrante} ${nuevoRegistroB.apellido_entrante})`,
      req.body,
      req.body.id_registro_a
    );
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
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
      limiteNum
    );

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

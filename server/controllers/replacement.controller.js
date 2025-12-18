const replacementService = require("../services/replacement.service");
const auditService = require("../services/audit.service");
const Reemplazo = require("../models/replacement.model");

async function registerReemplazo(req, res) {
  try {
    const nuevoReemplazo = await replacementService.registrar(req.body);
    // Log Auditoría
    await auditService.logAction(
      "CREAR",
      "REEMPLAZOS",
      req.user,
      `Se creó un nuevo reemplazo ${nuevoReemplazo.id_negocio} para ${req.body.nombre_saliente} ${req.body.apellido_saliente}`,
      req.body,
      nuevoReemplazo._id
    );
    res.sendStatus(201);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function mostrarReemplazos(req, res) {
  const data = await replacementService.obtenerActivos();
  res.json(data);
}

async function mostrarHistorial(req, res) {
  const data = await replacementService.obtenerInactivos();
  res.json(data);
}

async function actualizarReemplazo(req, res) {
  try {
    const original = await replacementService.obtenerPorId(req.params.id);
    const data = await replacementService.actualizar(req.params.id, req.body);

    // Log Auditoría
    const validFields = Object.keys(Reemplazo.schema.paths);
    const cleanBody = {};
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
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
}

//finalizar reemplazo
async function finalizarReemplazo(req, res) {
  try {
    const original = await replacementService.obtenerPorId(req.params.id);
    const data = await replacementService.finalizarReemplazo(req.params.id);

    // Log Auditoría
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
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
}

//anular reemplazo
async function anularReemplazo(req, res) {
  try {
    const original = await replacementService.obtenerPorId(req.params.id);
    const data = await replacementService.anularReemplazo(req.params.id);

    // Log Auditoría
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
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function obtenerHistorialUsuario(req, res) {
  try {
    const data = await replacementService.obtenerHistorialUsuario(
      req.params.id
    );
    res.json(data);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function procesarSustitucion(req, res) {
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
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function mostrarHistorialPaginado(req, res) {
  try {
    // Extraer los filtros y la paginación de req.query
    const { pagina, limite, ...filtros } = req.query;

    // Convertir a números (asegurando valores por defecto si no vienen)
    const paginaNum = parseInt(pagina) || 1;
    const limiteNum = parseInt(limite) || 10;

    // Llamar a la función del servicio con los filtros y paginación
    const data = await replacementService.obtenerInactivosPaginados(
      filtros,
      paginaNum,
      limiteNum
    );

    res.json(data);
  } catch (error) {
    // Manejo de errores
    res.status(500).json({
      mensaje: error.message || "Error al cargar el historial paginado.",
    });
  }
}

module.exports = {
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

const replacementService = require('../services/replacement.service');

async function registerReemplazo(req, res) {
  try {
    await replacementService.registrar(req.body);
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
    const data = await replacementService.actualizar(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function eliminarReemplazo(req, res) {
  try {
    const data = await replacementService.eliminar(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
}

async function obtenerHistorialUsuario(req, res) {
  try {
    const data = await replacementService.obtenerHistorialUsuario(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
}

module.exports = {
  registerReemplazo,
  mostrarReemplazos,
  mostrarHistorial,
  actualizarReemplazo,
  eliminarReemplazo,
  obtenerHistorialUsuario
};



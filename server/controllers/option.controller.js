const optionService = require('../services/option.service');

async function mostrarServicios(req, res) {
  const data = await optionService.obtener('SERVICIOS');
  res.json(data);
}

async function mostrarTipoTurnos(req, res) {
  const data = await optionService.obtener('TIPO_TURNO');
  res.json(data);
}

async function mostrarTipoCargo(req, res) {
  const data = await optionService.obtener('TIPO_CARGO');
  res.json(data);
}

async function mostrarHabilitado(req, res) {
  const data = await optionService.obtener('HABILITADO');
  res.json(data);
}

module.exports = {
  mostrarServicios,
  mostrarTipoTurnos,
  mostrarTipoCargo,
  mostrarHabilitado,
};

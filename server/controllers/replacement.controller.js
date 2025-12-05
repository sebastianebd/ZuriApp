const replacementService = require("../services/replacement.service");

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

//finalizar reemplazo
async function finalizarReemplazo(req, res) {
  try {
    const data = await replacementService.finalizarReemplazo(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
}

//anular reemplazo
async function anularReemplazo(req, res) {
  try {
    const data = await replacementService.anularReemplazo(req.params.id);
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
        res.status(500).json({ mensaje: error.message || "Error al cargar el historial paginado." });
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

const express = require('express');
const router = express.Router();
const optionController = require('../../controllers/option.controller');
const authMiddleware = require('../../middleware/authentication.middleware');

// Todas protegidas
router.use(authMiddleware);

router.get('/servicios', optionController.mostrarServicios);
router.get('/tipo-turnos', optionController.mostrarTipoTurnos);
router.get('/tipo-cargos', optionController.mostrarTipoCargo);
router.get('/habilitado', optionController.mostrarHabilitado);

module.exports = router;

const express = require('express');
const router = express.Router();
const replacementController = require('../../controllers/replacement.controller');
const authMiddleware = require('../../middleware/authentication.middleware');

// Todas protegidas
router.use(authMiddleware);

router.post('/', replacementController.registerReemplazo);
router.put('/:id', replacementController.actualizarReemplazo);
router.get('/', replacementController.mostrarReemplazos);
router.get('/historial', replacementController.mostrarHistorial);
router.put('/finalizar/:id', replacementController.finalizarReemplazo);
router.put('/anular/:id', replacementController.anularReemplazo);
router.get('/:id', replacementController.obtenerHistorialUsuario);
router.post('/sustituir', replacementController.procesarSustitucion);

module.exports = router;

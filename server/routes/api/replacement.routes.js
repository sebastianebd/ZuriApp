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
router.delete('/:id', replacementController.eliminarReemplazo);

module.exports = router;

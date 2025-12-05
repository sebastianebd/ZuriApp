// En /routes/replacement.router.js

const express = require('express');
const router = express.Router();
const replacementController = require('../../controllers/replacement.controller');
const authMiddleware = require('../../middleware/authentication.middleware');

// Todas protegidas
router.use(authMiddleware);

router.post('/', replacementController.registerReemplazo);
router.put('/:id', replacementController.actualizarReemplazo);
router.put('/finalizar/:id', replacementController.finalizarReemplazo);
router.put('/anular/:id', replacementController.anularReemplazo);
router.post('/sustituir', replacementController.procesarSustitucion);



router.get('/', replacementController.mostrarReemplazos);             // Activos
router.get('/historial', replacementController.mostrarHistorial);    // Historial antiguo
router.get('/historial-paginado', replacementController.mostrarHistorialPaginado); // 💡 ¡MOVIDA AQUÍ!



router.get('/:id', replacementController.obtenerHistorialUsuario); // Ruta que captura cualquier ID


module.exports = router;

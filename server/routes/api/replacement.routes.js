// En /routes/replacement.router.js

const express = require("express");
const router = express.Router();
const replacementController = require("../../controllers/replacement.controller");
const authMiddleware = require("../../middleware/authentication.middleware");

/**
 * @swagger
 * tags:
 *   name: Replacements
 *   description: Operaciones de Reemplazos
 */
// Todas protegidas
router.use(authMiddleware);

/**
 * @swagger
 * /reemplazos:
 *   post:
 *     summary: Crear nuevo reemplazo
 *     tags: [Replacements]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReplacementInput'
 *     responses:
 *       201:
 *         description: Reemplazo creado
 */

router.post("/", replacementController.registerReemplazo);

/**
 * @swagger
 * /reemplazos/{id}:
 *   put:
 *     summary: Actualizar datos de un reemplazo
 *     tags: [Replacements]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reemplazo actualizado
 */
router.put("/:id", replacementController.actualizarReemplazo);

/**
 * @swagger
 * /reemplazos/finalizar/{id}:
 *   put:
 *     summary: Finalizar un reemplazo
 *     tags: [Replacements]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Reemplazo finalizado
 */
router.put("/finalizar/:id", replacementController.finalizarReemplazo);

/**
 * @swagger
 * /reemplazos/anular/{id}:
 *   put:
 *     summary: Anular un reemplazo (lógico)
 *     tags: [Replacements]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Reemplazo anulado
 */
router.put("/anular/:id", replacementController.anularReemplazo);

/**
 * @swagger
 * /reemplazos/sustituir:
 *   post:
 *     summary: Procesar sustitución de reemplazante
 *     tags: [Replacements]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SustitucionInput'
 *     responses:
 *       200:
 *         description: Sustitución procesada
 */
router.post("/sustituir", replacementController.procesarSustitucion);

/**
 * @swagger
 * /reemplazos:
 *   get:
 *     summary: Listar reemplazos activos
 *     tags: [Replacements]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de reemplazos activos
 */
router.get("/", replacementController.mostrarReemplazos); // Activos
/**
 * @swagger
 * /reemplazos/historial:
 *   get:
 *     summary: Ver historial completo
 *     tags: [Replacements]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Historial completo
 */
router.get("/historial", replacementController.mostrarHistorial); // Historial antiguo
/**
 * @swagger
 * /reemplazos/historial-paginado:
 *   get:
 *     summary: Ver historial paginado
 *     tags: [Replacements]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Historial paginado
 */
router.get(
  "/historial-paginado",
  replacementController.mostrarHistorialPaginado
); // 💡 ¡MOVIDA AQUÍ!

router.get("/:id", replacementController.obtenerHistorialUsuario); // Ruta que captura cualquier ID

module.exports = router;

import express from "express";
import replacementController from "../../controllers/replacement.controller";
import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";
import { validateSchema } from "../../middleware/validate.middleware";
import {
  createReplacementSchema,
  updateReplacementSchema,
  substitutionSchema,
} from "../../schemas/replacement.schema";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Replacements
 *   description: Operaciones de Reemplazos
 */
// Todas protegidas
router.use(authMiddleware);

// Remove global permission
// router.use(requirePermission("replacement.manage"));

router.post(
  "/",
  requirePermission("replacement.create"),
  validateSchema(createReplacementSchema),
  replacementController.registerReemplazo
);

/**
 * ...
 */
router.put(
  "/:id",
  requirePermission("replacement.update"),
  validateSchema(updateReplacementSchema),
  replacementController.actualizarReemplazo
);

/**
 * ...
 */
router.put(
  "/finalizar/:id",
  requirePermission("replacement.update"),
  replacementController.finalizarReemplazo
);

/**
 * ...
 */
router.put(
  "/anular/:id",
  requirePermission("replacement.update"),
  replacementController.anularReemplazo
); // Anular considered Update status

/**
 * ...
 */
router.post(
  "/sustituir",
  requirePermission("replacement.create"), // Creates a NEW replacement
  validateSchema(substitutionSchema),
  replacementController.procesarSustitucion
);

/**
 * ...
 */
router.get(
  "/",
  requirePermission("replacement.view"),
  replacementController.mostrarReemplazos
); // Activos
/**
 * ...
 */
router.get(
  "/historial",
  requirePermission("replacement.view"),
  replacementController.mostrarHistorial
); // Historial antiguo
/**
 * ...
 */
router.get(
  "/historial-paginado",
  requirePermission("replacement.view"),
  replacementController.mostrarHistorialPaginado
);

router.get(
  "/:id",
  requirePermission("replacement.view"),
  replacementController.obtenerHistorialUsuario
);

export default router;

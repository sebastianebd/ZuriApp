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

// Middleware de Seguridad Base
// Requiere autenticación para cualquier operación de reemplazos.
router.use(authMiddleware);

// --- Operaciones de Creación ---
// Requieren permiso explícito 'creation' para evitar solicitudes de roles no autorizados.
router.post(
  "/",
  requirePermission("replacement.create"),
  validateSchema(createReplacementSchema), // Validación estricta de payload
  replacementController.registerReemplazo,
);

// --- Operaciones de Modificación ---
// El flujo de vida (Aprobar, Rechazar) se maneja a través de PUT.
router.put(
  "/:id",
  requirePermission("replacement.update"),
  validateSchema(updateReplacementSchema),
  replacementController.actualizarReemplazo,
);

router.put(
  "/finalizar/:id",
  requirePermission("replacement.update"),
  replacementController.finalizarReemplazo,
);

router.put(
  "/anular/:id",
  requirePermission("replacement.update"),
  replacementController.anularReemplazo,
); // Anular se considera una actualización de estado (Soft Delete lógico)

// --- Sustituciones Complejas ---
// Caso especial: Reemplazo de un reemplazo existente.
router.post(
  "/sustituir",
  requirePermission("replacement.create"), // Se trata como crear un nuevo contrato
  validateSchema(substitutionSchema),
  replacementController.procesarSustitucion,
);

// --- Consultas / Lectura ---
router.get(
  "/",
  requirePermission("replacement.view"),
  replacementController.mostrarReemplazos,
); // Filtra por activos

router.get(
  "/historial",
  requirePermission("replacement.view"),
  replacementController.mostrarHistorial,
); // Historial histórico / archivado

router.get(
  "/historial-paginado",
  requirePermission("replacement.view"),
  replacementController.mostrarHistorialPaginado,
);

router.get(
  "/:id",
  requirePermission("replacement.view"),
  replacementController.obtenerHistorialUsuario,
);

export default router;

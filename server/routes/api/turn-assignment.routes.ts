import { Router } from "express";
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} from "../../controllers/turn-assignment.controller";
import { validateSchema } from "../../middleware/validate.middleware";
import {
  createTurnAssignmentSchema,
  updateTurnAssignmentSchema,
} from "../../schemas/turn-assignment.schema";

import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";
import { validateObjectId } from "../../middleware/validate-object-id.middleware";

const router = Router();

// --- Asignación de Turnos (Grilla Base) ---
// Define la estructura "permanente" de turnos de los funcionarios.
router.use(authMiddleware);
// Nota: Se requieren permisos granulares para cada acción debido a la sensibilidad
// de alterar la planificación operativa.

router.get("/", requirePermission("shifts.view"), getAssignments);
router.get("/:id", requirePermission("shifts.view"), validateObjectId(), getAssignmentById);

router.post(
  "/",
  requirePermission("shifts.create"), // Solo Jefaturas/Admin
  validateSchema(createTurnAssignmentSchema),
  createAssignment,
);

router.put(
  "/:id",
  requirePermission("shifts.update"),
  validateObjectId(),
  validateSchema(updateTurnAssignmentSchema),
  updateAssignment,
);

router.delete("/:id", requirePermission("shifts.delete"), validateObjectId(), deleteAssignment);

export default router;

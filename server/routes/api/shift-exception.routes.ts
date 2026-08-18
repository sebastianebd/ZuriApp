import { Router } from "express";
import {
  createException,
  getExceptions,
  getExceptionById,
  deleteException,
} from "../../controllers/shift-exception.controller";
import { validateSchema } from "../../middleware/validate.middleware";
import { createShiftExceptionSchema } from "../../schemas/shift-exception.schema";
import { validateObjectId } from "../../middleware/validate-object-id.middleware";

import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = Router();

// --- Gestión de Excepciones de Turno ---
// Maneja overrides temporales (ej: Licencias Médicas, Permisos) sobre la grilla base.
router.use(authMiddleware);

// [QUALITY] Permiso aplicado por ruta individual (evita anti-patrón router.use global)
router.get("/", requirePermission("shifts.manage"), getExceptions);
router.get("/:id", requirePermission("shifts.manage"), validateObjectId(), getExceptionById);

// Validación estricta del payload para evitar inconsistencias en la grilla.
router.post("/", requirePermission("shifts.manage"), validateSchema(createShiftExceptionSchema), createException);

router.delete("/:id", requirePermission("shifts.manage"), validateObjectId(), deleteException);

export default router;

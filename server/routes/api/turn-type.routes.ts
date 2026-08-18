import { Router } from "express";
import {
  getTurnTypes,
  createTurnType,
  updateTurnType,
  deleteTurnType,
} from "../../controllers/turn-type.controller";
import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = Router();

// --- Tipos de Turno ---
// Configuración estructural de los turnos (Horarios, reglas).
router.use(authMiddleware);

router.get("/", requirePermission("turn-type.view"), getTurnTypes);

// Modificaciones restringidas a administradores de turnos
router.post("/", requirePermission("turn-type.create"), createTurnType);
router.put("/:id", requirePermission("turn-type.update"), updateTurnType);
router.delete("/:id", requirePermission("turn-type.delete"), deleteTurnType);

export default router;

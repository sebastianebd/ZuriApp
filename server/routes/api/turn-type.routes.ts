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

router.get("/", getTurnTypes);

// Modificaciones restringidas a administradores de turnos
router.post("/", requirePermission("gestionar.turnos"), createTurnType);
router.put("/:id", requirePermission("gestionar.turnos"), updateTurnType);
router.delete("/:id", requirePermission("gestionar.turnos"), deleteTurnType);

export default router;

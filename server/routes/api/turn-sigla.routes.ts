import { Router } from 'express';
import * as TurnSiglaController from '../../controllers/turn-sigla.controller';
import authMiddleware, { requirePermission } from '../../middleware/authentication.middleware';
import { validateSchema } from '../../middleware/validate.middleware';
import { createTurnSiglaSchema, updateTurnSiglaSchema } from '../../schemas/turn-sigla.schema';

const router = Router();

// --- Configuración de Siglas de Turno ---
// ABM simple para las siglas visuales en el calendario (L, N, X, etc.)
router.use(authMiddleware);

router.get("/", TurnSiglaController.getTurnSiglas);

// [SECURITY] Escrituras restringidas a roles con permiso de gestión de turnos
router.post("/", requirePermission("gestionar.turnos"), validateSchema(createTurnSiglaSchema), TurnSiglaController.createTurnSigla);
router.put("/:id", requirePermission("gestionar.turnos"), validateSchema(updateTurnSiglaSchema), TurnSiglaController.updateTurnSigla);
router.delete("/:id", requirePermission("gestionar.turnos"), TurnSiglaController.deleteTurnSigla);

export default router;

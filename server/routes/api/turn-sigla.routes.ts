import { Router } from "express";
import * as TurnSiglaController from "../../controllers/turn-sigla.controller";
import authMiddleware from "../../middleware/authentication.middleware";

const router = Router();

// Protect all routes
router.use(authMiddleware);

router.get("/", TurnSiglaController.getTurnSiglas);
router.post("/", TurnSiglaController.createTurnSigla);
router.put("/:id", TurnSiglaController.updateTurnSigla);
router.delete("/:id", TurnSiglaController.deleteTurnSigla);

export default router;

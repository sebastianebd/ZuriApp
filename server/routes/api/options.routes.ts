import express from "express";
import optionController from "../../controllers/option.controller";
import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = express.Router();

// Todas protegidas
router.use(authMiddleware);

router.get(
  "/servicios",
  // requirePermission("config.view"), // Dropdown usage requires open access
  optionController.mostrarServicios
);
router.get(
  "/tipo-turnos",
  // requirePermission("config.view"), // Dropdown usage requires open access
  optionController.mostrarTipoTurnos
);
router.get("/tipo-cargos", optionController.mostrarTipoCargo); // This is needed for dropdowns, maybe public? Or basic auth ok.
router.get("/habilitado", optionController.mostrarHabilitado); // Basic dropdown

export default router;

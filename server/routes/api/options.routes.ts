import express from "express";
import optionController from "../../controllers/option.controller";
import authMiddleware from "../../middleware/authentication.middleware";

const router = express.Router();

// Todas protegidas
router.use(authMiddleware);

router.get("/servicios", optionController.mostrarServicios);
router.get("/tipo-turnos", optionController.mostrarTipoTurnos);
router.get("/tipo-cargos", optionController.mostrarTipoCargo);
router.get("/habilitado", optionController.mostrarHabilitado);

export default router;

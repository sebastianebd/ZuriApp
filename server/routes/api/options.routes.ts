import express from "express";
import optionController from "../../controllers/option.controller";
import authMiddleware from "../../middleware/authentication.middleware";

const router = express.Router();

// Middleware Global: Todas las opciones de configuración requieren autenticación.
router.use(authMiddleware);

// Endpoints de Utilidad para Dropdowns (Bajo Acoplamiento)
// Nota: Se han eliminado restricciones estrictas de permisos ("config.view")
// porque estos endpoints son necesarios transversalmente en la UI para todos los roles.
router.get("/servicios", optionController.mostrarServicios);
router.get("/tipo-turnos", optionController.mostrarTipoTurnos);
router.get("/tipo-cargos", optionController.mostrarTipoCargo);
router.get("/habilitado", optionController.mostrarHabilitado);

export default router;

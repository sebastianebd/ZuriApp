import express from "express";
import profileController from "../../controllers/profile.controller";
import authMiddleware from "../../middleware/authentication.middleware";

const router = express.Router();

// --- Rutas de Perfil de Usuario ---
// Todas las rutas requieren un token válido. El ID del usuario se extrae del JWT
// en el controlador, garantizando que un usuario solo pueda ver SU propia data.
router.use(authMiddleware);

// Métricas Personales: Reemplazos realizados vs solicitados
router.get("/stats/replacements", profileController.getReplacementStats);

// Métricas de Servicio: Distribución de horas por unidad
router.get("/stats/services", profileController.getServiceStats);

// Feed de Actividad: Últimos movimientos del usuario
router.get("/activity/recent", profileController.getRecentActivity);

export default router;

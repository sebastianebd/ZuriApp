import express from "express";
import profileController from "../../controllers/profile.controller";
import authMiddleware from "../../middleware/authentication.middleware";

const router = express.Router();

// Todas las rutas de perfil requieren autenticación
router.use(authMiddleware);

// GET /api/profile/stats/replacements
router.get("/stats/replacements", profileController.getReplacementStats);

// GET /api/profile/stats/services
router.get("/stats/services", profileController.getServiceStats);

// GET /api/profile/activity/recent
router.get("/activity/recent", profileController.getRecentActivity);

export default router;

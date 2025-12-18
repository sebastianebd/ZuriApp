const express = require("express");
const router = express.Router();
const profileController = require("../../controllers/profile.controller");
const authMiddleware = require("../../middleware/authentication.middleware");

// Todas las rutas de perfil requieren autenticación
router.use(authMiddleware);

// GET /api/profile/stats/replacements
router.get("/stats/replacements", profileController.getReplacementStats);

// GET /api/profile/stats/services
router.get("/stats/services", profileController.getServiceStats);

// GET /api/profile/activity/recent
router.get("/activity/recent", profileController.getRecentActivity);

module.exports = router;

import express from "express";
import auditController from "../../controllers/audit.controller";
import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = express.Router();

// Middleware Global de Autenticación
// Todas las rutas de auditoría requieren un usuario autenticado y verificado.
router.use(authMiddleware);

// GET /api/audit
// Endpoint protegido para consultar el historial de cambios.
// Requiere permiso explícito 'audit.view' para evitar filtración de datos sensibles.
router.get("/", requirePermission("audit.view"), auditController.getAuditLogs);

export default router;

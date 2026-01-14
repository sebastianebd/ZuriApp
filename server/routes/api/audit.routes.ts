import express from "express";
import auditController from "../../controllers/audit.controller";
import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = express.Router();

router.use(authMiddleware);

// GET /api/audit
router.get("/", requirePermission("audit.view"), auditController.getAuditLogs);

export default router;

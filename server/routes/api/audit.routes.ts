import express from "express";
import auditController from "../../controllers/audit.controller";
import authMiddleware from "../../middleware/authentication.middleware";

const router = express.Router();

router.use(authMiddleware);

// GET /api/audit
router.get("/", auditController.getAuditLogs);

export default router;

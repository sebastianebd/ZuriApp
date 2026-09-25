import { Router } from "express";
import {
  getAlertsHandler,
  acknowledgeAlertHandler,
  resolveAlertHandler,
} from "../../controllers/alert.controller";
import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = Router();

router.use(authMiddleware);

// GET /api/alerts
router.get("/", requirePermission("shifts.view"), getAlertsHandler);

// PATCH /api/alerts/:id/acknowledge
router.patch(
  "/:id/acknowledge",
  requirePermission("shifts.update"),
  acknowledgeAlertHandler,
);

// PATCH /api/alerts/:id/resolve
router.patch(
  "/:id/resolve",
  requirePermission("shifts.update"),
  resolveAlertHandler,
);

export default router;

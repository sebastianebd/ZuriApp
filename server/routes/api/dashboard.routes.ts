import { Router } from "express";
import { getServiceKPIsHandler } from "../../controllers/dashboard.controller";
import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = Router();

router.use(authMiddleware);

// GET /api/dashboard/:serviceId/kpis
router.get(
  "/:serviceId/kpis",
  requirePermission("shifts.view"),
  getServiceKPIsHandler,
);

export default router;

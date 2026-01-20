import { Router } from "express";
import * as ReportController from "../../controllers/report.controller";
import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = Router();

// Protect all report routes
router.use(authMiddleware);

// GET /api/reports/summary?month=1&year=2025&service=UCI
router.get(
  "/summary",
  requirePermission("shifts.view"),
  ReportController.getMonthlySummary
);

// GET /api/reports/export/excel?month=1&year=2025&service=UCI
router.get(
  "/export/excel",
  requirePermission("shifts.view"),
  ReportController.exportExcel
);

export default router;

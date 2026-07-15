import { Router } from "express";
import * as ReportController from "../../controllers/report.controller";
import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = Router();
router.use(authMiddleware);

// Resumen individual (Lazy Evaluation — crea snapshot si período está cerrado)
router.get(
  "/summary",
  requirePermission("shifts.view"),
  ReportController.getMonthlySummary,
);

// Exportación Excel por Servicio (abierto: al vuelo, cerrado: desde Snapshots)
router.get(
  "/export/excel",
  requirePermission("shifts.view"),
  ReportController.exportExcelByService,
);

// Exportación Excel Individual (abierto: al vuelo, cerrado: desde Snapshots)
router.get(
  "/export/excel/individual",
  requirePermission("shifts.view"),
  ReportController.exportIndividualExcel,
);

// URL firmada S3 para descargar el PDF oficial de un servicio (solo períodos cerrados)
router.get(
  "/service/pdf",
  requirePermission("shifts.view"),
  ReportController.getServicePDFUrl,
);

export default router;

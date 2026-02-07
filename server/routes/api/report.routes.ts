import { Router } from "express";
import * as ReportController from "../../controllers/report.controller";
import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = Router();

// Middleware Global: Restricción total de acceso a reportes (Información Sensible).
router.use(authMiddleware);

// Resumen Mensual: Agregación de horas y cumplimiento.
router.get(
  "/summary",
  requirePermission("shifts.view"), // El mismo permiso de ver turnos habilita ver reportes agregados
  ReportController.getMonthlySummary,
);

// Exportación de Datos: Generación de Excel para nómina/RRHH.
router.get(
  "/export/excel",
  requirePermission("shifts.view"),
  ReportController.exportExcel,
);

export default router;

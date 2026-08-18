import { Router } from "express";
import * as PeriodController from "../../controllers/period.controller";
import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = Router();
router.use(authMiddleware);

// Consulta del estado del período
router.get("/", requirePermission("shifts.view"), PeriodController.getPeriod);

// Cierre global del período (requiere permiso de gestión)
router.put(
  "/close",
  requirePermission("periods.manage"),
  PeriodController.closePeriod,
);

// Gestión de excepciones individuales (sub-recurso RESTful)
router.post(
  "/:id/exceptions",
  requirePermission("periods.manage"),
  PeriodController.addException,
);
// [DOMAIN] Parámetro renombrado de :userId a :staffId para coherencia con dominio Staff
router.delete(
  "/:id/exceptions/:staffId",
  requirePermission("periods.manage"),
  PeriodController.removeException,
);

export default router;

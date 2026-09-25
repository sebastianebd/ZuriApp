import { Router } from "express";
import {
  getServices,
  createService,
  updateService,
  deleteService,
  updateServiceStaffingHandler,
} from "../../controllers/service.controller";
import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = Router();

router.use(authMiddleware);

// --- Listado General ---
// Requiere permiso de visualización para ver los servicios
router.get("/", requirePermission("service.view"), getServices);

// --- Gestión Administrativa ---
router.post("/", requirePermission("service.create"), createService);
router.put("/:id", requirePermission("service.update"), updateService);
router.delete("/:id", requirePermission("service.delete"), deleteService);

// --- Dotación Mínima y Gobernanza Contextual ---
router.patch("/:id/staffing", updateServiceStaffingHandler);

export default router;


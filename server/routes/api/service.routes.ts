import { Router } from "express";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../../controllers/service.controller";
import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getServices); // Accessible to all authenticated users (needed for dropdowns)

router.post("/", requirePermission("gestionar.turnos"), createService);
router.put("/:id", requirePermission("gestionar.turnos"), updateService);
router.delete("/:id", requirePermission("gestionar.turnos"), deleteService);

export default router;

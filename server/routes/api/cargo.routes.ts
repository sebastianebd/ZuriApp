import { Router } from "express";
import * as CargoController from "../../controllers/cargo.controller";
import authMiddleware, {
  requireAdmin,
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = Router();

// Public or Authenticated (GET is for dropdowns)
router.get("/", authMiddleware, CargoController.getCargos);

// Admin only operations
// Admin only operations
router.post(
  "/",
  authMiddleware,
  requirePermission("cargos.create"),
  CargoController.createCargo
);
router.put(
  "/:id",
  authMiddleware,
  requirePermission("cargos.update"),
  CargoController.updateCargo
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermission("cargos.delete"),
  CargoController.deleteCargo
);

export default router;

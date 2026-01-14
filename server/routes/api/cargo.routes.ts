import { Router } from "express";
import * as CargoController from "../../controllers/cargo.controller";
import authMiddleware, {
  requireAdmin,
} from "../../middleware/authentication.middleware";

const router = Router();

// Public or Authenticated (GET is for dropdowns)
router.get("/", authMiddleware, CargoController.getCargos);

// Admin only operations
router.post("/", authMiddleware, requireAdmin, CargoController.createCargo);
router.put("/:id", authMiddleware, requireAdmin, CargoController.updateCargo);
router.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  CargoController.deleteCargo
);

export default router;

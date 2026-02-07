import { Router } from "express";
import * as CargoController from "../../controllers/cargo.controller";
import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = Router();

// --- Rutas Generales ---
// GET disponible para usuarios autenticados (necesario para dropdowns y filtros).
router.get("/", authMiddleware, CargoController.getCargos);

// --- Rutas Administrativas ---
// Requieren permisos explícitos de gestión de cargos (CRUD).
router.post(
  "/",
  authMiddleware,
  requirePermission("cargos.create"),
  CargoController.createCargo,
);
router.put(
  "/:id",
  authMiddleware,
  requirePermission("cargos.update"),
  CargoController.updateCargo,
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermission("cargos.delete"),
  CargoController.deleteCargo,
);

export default router;

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

// --- Listado General ---
// Accesible para todos los usuarios autenticados.
// CRÍTICO: Se usa intensivamente en dropdowns y selectores de la UI.
// No restringir con permisos granulares para evitar romper la UX de selección.
router.get("/", getServices);

// --- Gestión Administrativa ---
// Solo usuarios con permiso 'gestionar.turnos' (Jefaturas/Admin) pueden alterar la estructura organizacional.
router.post("/", requirePermission("gestionar.turnos"), createService);
router.put("/:id", requirePermission("gestionar.turnos"), updateService);
router.delete("/:id", requirePermission("gestionar.turnos"), deleteService);

export default router;

import { Router } from "express";
import { getPublicUserShifts } from "../../controllers/public.controller";

const router = Router();

// --- Rutas Públicas de solo lectura ---
// Permite compartir vistas de turnos mediante enlaces únicos sin requerir login.
// Útil para integración rápida con calendarios externos o revisión rápida.
// TODO: Evaluar agregar Rate Limiting específico aquí si el tráfico aumenta.

router.get("/shifts", getPublicUserShifts);

export default router;

import { Router } from "express";
import { getPublicUserShifts } from "../../controllers/public.controller";
import { generalLimiter } from "../../config/limiter.config";

const router = Router();

// --- Rutas Públicas de solo lectura ---
// Permite compartir vistas de turnos mediante enlaces únicos sin requerir login.
// [SECURITY] Rate-limited para prevenir scraping masivo.
// TODO: Evaluar agregar Rate Limiting específico aquí si el tráfico aumenta.

router.get("/shifts", generalLimiter, getPublicUserShifts);

export default router;

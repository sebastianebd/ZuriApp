import { Router } from "express";
import calendarController from "../../controllers/calendar.controller";
import { generalLimiter } from "../../config/limiter.config";

const router = Router();

// --- Rutas Públicas (Sin Autenticación) ---
// Decisión de Diseño: Estas rutas son accesibles públicamente para facilitar la integración
// rápida (ej: añadir a Google Calendar desde móvil) sin flujos de login complejos.
// [SECURITY] Rate-limited para prevenir scraping masivo de horarios de Staff.

// Descarga directa de archivo .ics
router.get("/ics/:id", generalLimiter, calendarController.downloadIcs);

// Vista web landing para mejor UX móvil antes de descargar
router.get("/view/:id", generalLimiter, calendarController.viewEventPage);

export default router;

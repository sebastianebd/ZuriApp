import { Router } from "express";
import calendarController from "../../controllers/calendar.controller";

const router = Router();

// --- Rutas Públicas (Sin Autenticación) ---
// Decisión de Diseño: Estas rutas son accesibles públicamente para facilitar la integración
// rápida (ej: añadir a Google Calendar desde móvil) sin flujos de login complejos.

// Descarga directa de archivo .ics
router.get("/ics/:id", calendarController.downloadIcs);

// Vista web landing para mejor UX móvil antes de descargar
router.get("/view/:id", calendarController.viewEventPage);

export default router;

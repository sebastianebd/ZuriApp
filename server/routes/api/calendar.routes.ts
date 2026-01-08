import { Router } from "express";
import calendarController from "../../controllers/calendar.controller";

const router = Router();

// Public route (no auth required) so it works easily from phone link
// Security Note: In strict enterprise, we might want a signed token in URL,
// but for this use case, ID enumeration risk is low impact (just calendar info).

// Direct download
router.get("/ics/:id", calendarController.downloadIcs);

// Landing page for better Mobile UX
router.get("/view/:id", calendarController.viewEventPage);

export default router;

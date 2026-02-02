import { Router } from "express";
import { getPublicUserShifts } from "../../controllers/public.controller";

const router = Router();

// /public/shifts?userId=...
router.get("/shifts", getPublicUserShifts);

export default router;

import { Router } from "express";
import {
  createException,
  getExceptions,
  getExceptionById,
  deleteException,
} from "../../controllers/shift-exception.controller";
import { validateSchema } from "../../middleware/validate.middleware";
import { createShiftExceptionSchema } from "../../schemas/shift-exception.schema";

import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = Router();

router.use(authMiddleware);
router.use(requirePermission("shifts.manage"));

router.get("/", getExceptions);
router.get("/:id", getExceptionById);
router.post("/", validateSchema(createShiftExceptionSchema), createException);
router.delete("/:id", deleteException);

export default router;

import { Router } from "express";
import {
  createException,
  getExceptions,
  getExceptionById,
  deleteException,
} from "../../controllers/shift-exception.controller";
import { validateSchema } from "../../middleware/validate.middleware";
import { createShiftExceptionSchema } from "../../schemas/shift-exception.schema";

const router = Router();

router.get("/", getExceptions);
router.get("/:id", getExceptionById);
router.post("/", validateSchema(createShiftExceptionSchema), createException);
router.delete("/:id", deleteException);

export default router;

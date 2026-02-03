import { Router } from "express";
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} from "../../controllers/turn-assignment.controller";
import { validateSchema } from "../../middleware/validate.middleware";
import {
  createTurnAssignmentSchema,
  updateTurnAssignmentSchema,
} from "../../schemas/turn-assignment.schema";

import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware";

const router = Router();

router.use(authMiddleware);
// router.use(requirePermission("shifts.manage"));

router.get("/", requirePermission("shifts.view"), getAssignments);
router.get("/:id", requirePermission("shifts.view"), getAssignmentById);
router.post(
  "/",
  requirePermission("shifts.create"),
  validateSchema(createTurnAssignmentSchema),
  createAssignment
);
router.put(
  "/:id",
  requirePermission("shifts.update"),
  validateSchema(updateTurnAssignmentSchema),
  updateAssignment
);
router.delete("/:id", requirePermission("shifts.delete"), deleteAssignment);

export default router;

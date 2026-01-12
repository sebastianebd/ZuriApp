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

const router = Router();

router.get("/", getAssignments);
router.get("/:id", getAssignmentById);
router.post("/", validateSchema(createTurnAssignmentSchema), createAssignment);
router.put(
  "/:id",
  validateSchema(updateTurnAssignmentSchema),
  updateAssignment
);
router.delete("/:id", deleteAssignment);

export default router;

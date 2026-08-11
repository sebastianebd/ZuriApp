import { Router } from 'express';
import { createStaff, updateStaff, deleteStaff, getAllStaff, getStaffById, sendResetLink } from '../../controllers/staff.controller';
import authMiddleware, { requirePermission } from '../../middleware/authentication.middleware';
import { validateSchema } from "../../middleware/validate.middleware";
import { createStaffSchema, updateStaffSchema } from "../../schemas/staff.schema";
import { validateObjectId } from "../../middleware/validate-object-id.middleware";

const router = Router();

router.use(authMiddleware);

router.post('/', requirePermission("users.create"), validateSchema(createStaffSchema), createStaff);
router.put('/:id', requirePermission("users.update"), validateObjectId(), validateSchema(updateStaffSchema), updateStaff);
router.delete('/:id', requirePermission("users.delete"), validateObjectId(), deleteStaff);
router.get('/', requirePermission("users.view"), getAllStaff);
router.get('/:id', requirePermission("users.view"), validateObjectId(), getStaffById);
router.post('/:id/send-reset-link', requirePermission("users.reset_password"), validateObjectId(), sendResetLink);

export default router;

import { Router } from 'express';
import { toggleAccountStatus, sendResetLink, getAccountStatus } from '../../controllers/account.controller';
import authMiddleware, { requirePermission } from '../../middleware/authentication.middleware';
import { validateSchema } from "../../middleware/validate.middleware";
import { toggleAccountStatusSchema, sendResetLinkSchema } from "../../schemas/account.schema";

const router = Router();

router.use(authMiddleware);

router.patch('/:staffId/toggle-status', requirePermission("users.update"), validateSchema(toggleAccountStatusSchema), toggleAccountStatus);
router.post('/:staffId/send-reset-link', requirePermission("users.reset_password"), validateSchema(sendResetLinkSchema), sendResetLink);
router.get('/:staffId/status', requirePermission("users.update"), getAccountStatus);

export default router;


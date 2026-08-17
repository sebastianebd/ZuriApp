import { Router } from 'express';
import { getRoles, createRole, updateRole, deleteRole } from '../../controllers/role.controller';
import authMiddleware, { requirePermission } from '../../middleware/authentication.middleware';
import { validateSchema } from '../../middleware/validate.middleware';
import { createRoleSchema, updateRoleSchema } from '../../schemas/role.schema';
import { validateObjectId } from '../../middleware/validate-object-id.middleware';

const router = Router();

router.get('/', authMiddleware, requirePermission('role.view'), getRoles);
router.post('/', authMiddleware, requirePermission('role.create'), validateSchema(createRoleSchema), createRole);
router.put('/:id', authMiddleware, requirePermission('role.update'), validateObjectId(), validateSchema(updateRoleSchema), updateRole);
router.delete('/:id', authMiddleware, requirePermission('role.delete'), validateObjectId(), deleteRole);

export default router;

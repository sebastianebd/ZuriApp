import { Router } from 'express';
import { getPositions, createPosition, updatePosition, deletePosition } from '../../controllers/position.controller';
import authMiddleware, { requirePermission } from '../../middleware/authentication.middleware';
import { validateSchema } from '../../middleware/validate.middleware';
import { createPositionSchema, updatePositionSchema } from '../../schemas/position.schema';
import { validateObjectId } from '../../middleware/validate-object-id.middleware';

const router = Router();

router.get('/', authMiddleware, requirePermission('position.view'), getPositions);
router.post('/', authMiddleware, requirePermission('position.create'), validateSchema(createPositionSchema), createPosition);
router.put('/:id', authMiddleware, requirePermission('position.update'), validateObjectId(), validateSchema(updatePositionSchema), updatePosition);
router.delete('/:id', authMiddleware, requirePermission('position.delete'), validateObjectId(), deletePosition);

export default router;

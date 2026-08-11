import { Router } from 'express';
import { getPositions } from '../../controllers/position.controller';
import authMiddleware from '../../middleware/authentication.middleware';

const router = Router();

router.get('/', authMiddleware, getPositions);

export default router;

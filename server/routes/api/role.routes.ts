import { Router } from 'express';
import { getRoles } from '../../controllers/role.controller';
import authMiddleware from '../../middleware/authentication.middleware';

const router = Router();

router.get('/', authMiddleware, getRoles);

export default router;

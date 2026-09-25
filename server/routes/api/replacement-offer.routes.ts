import { Router } from 'express';
import {
  createOfferHandler,
  getOffersHandler,
  cancelOfferHandler,
  awardOfferHandler,
  getOpenOffersHandler,
  getMyApplicationsHandler,
  applyOfferHandler,
  withdrawOfferHandler,
  getOfferScoringHandler,
} from '../../controllers/replacement-offer.controller';
import authMiddleware, { requirePermission } from '../../middleware/authentication.middleware';
import portalAuthMiddleware from '../../middleware/portal-auth.middleware';
import { validateSchema } from '../../middleware/validate.middleware';
import {
  createReplacementOfferSchema,
  awardOfferSchema,
  applyOfferSchema,
  withdrawOfferSchema,
  cancelOfferSchema,
} from '../../schemas/replacement-offer.schema';

const router = Router();

// ==================== RUTAS PWA (HONORARIOS) ====================
// Definidas antes de /:id para evitar colisión de rutas
router.get('/open', portalAuthMiddleware, getOpenOffersHandler);
router.get('/my-applications', portalAuthMiddleware, getMyApplicationsHandler);
router.post(
  '/:id/apply',
  portalAuthMiddleware,
  validateSchema(applyOfferSchema),
  applyOfferHandler
);
router.post(
  '/:id/withdraw',
  portalAuthMiddleware,
  validateSchema(withdrawOfferSchema),
  withdrawOfferHandler
);

// ==================== RUTAS JEFATURA / DESKTOP ====================
router.get('/', authMiddleware, requirePermission('shifts.view'), getOffersHandler);
router.post(
  '/',
  authMiddleware,
  requirePermission('shifts.create'),
  validateSchema(createReplacementOfferSchema),
  createOfferHandler
);
router.patch(
  '/:id/cancel',
  authMiddleware,
  requirePermission('shifts.update'),
  validateSchema(cancelOfferSchema),
  cancelOfferHandler
);
router.post(
  '/:id/award',
  authMiddleware,
  requirePermission('shifts.create'),
  validateSchema(awardOfferSchema),
  awardOfferHandler
);
router.get(
  '/:id/scoring',
  authMiddleware,
  requirePermission('shifts.view'),
  getOfferScoringHandler
);

export default router;

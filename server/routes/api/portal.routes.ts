import { Router } from 'express';
import {
  requestOtpHandler,
  verifyOtpHandler,
  getMeHandler,
  logoutHandler,
} from '../../controllers/pwa-auth.controller';
import {
  getHomeSummaryHandler,
  getShiftsHandler,
  confirmShiftHandler,
  reportUnavailableHandler,
  getAdvanceReportHandler,
  getCartolaReportHandler,
  getReplacementVoucherHandler,
  updatePreferencesHandler,
} from '../../controllers/pwa-shifts.controller';
import { validateSchema } from '../../middleware/validate.middleware';
import { requestOtpSchema, verifyOtpSchema } from '../../schemas/pwa-auth.schema';
import {
  confirmShiftSchema,
  reportUnavailableSchema,
  updatePreferencesSchema,
} from '../../schemas/portal-shift.schema';
import portalAuthMiddleware from '../../middleware/portal-auth.middleware';

const router = Router();

// Rutas de autenticación PWA (públicas)
router.post('/auth/request-otp', validateSchema(requestOtpSchema), requestOtpHandler);
router.post('/auth/verify-otp', validateSchema(verifyOtpSchema), verifyOtpHandler);

// Rutas autenticadas PWA (protegidas por portalAuthMiddleware)
router.get('/auth/me', portalAuthMiddleware, getMeHandler);
router.post('/auth/logout', portalAuthMiddleware, logoutHandler);

// Turnos, Home y Confirmaciones
router.get('/home', portalAuthMiddleware, getHomeSummaryHandler);
router.get('/shifts', portalAuthMiddleware, getShiftsHandler);
router.post(
  '/shifts/:id/confirm',
  portalAuthMiddleware,
  validateSchema(confirmShiftSchema),
  confirmShiftHandler
);
router.post(
  '/shifts/:id/unavailable',
  portalAuthMiddleware,
  validateSchema(reportUnavailableSchema),
  reportUnavailableHandler
);

// Reportes PDF (Anti-IDOR)
router.get('/reports/advance', portalAuthMiddleware, getAdvanceReportHandler);
router.get('/reports/cartola', portalAuthMiddleware, getCartolaReportHandler);
router.get('/replacements/:id/voucher', portalAuthMiddleware, getReplacementVoucherHandler);

// Preferencias de perfil
router.patch(
  '/profile/preferences',
  portalAuthMiddleware,
  validateSchema(updatePreferencesSchema),
  updatePreferencesHandler
);

export default router;

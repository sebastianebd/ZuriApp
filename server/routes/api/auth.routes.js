const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');
const authMiddleware = require('../../middleware/authentication.middleware');

// Rutas públicas
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);

// Rutas protegidas
router.use(authMiddleware);
router.post('/logout', authController.logout);
router.get('/user', authController.user);

module.exports = router;



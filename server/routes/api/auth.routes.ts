import express from "express";
import authController from "../../controllers/auth.controller";
import authMiddleware from "../../middleware/authentication.middleware";
import { authLimiter } from "../../config/limiter.config";
import { validateSchema } from "../../middleware/validate.middleware";
import { loginSchema, changePasswordSchema } from "../../schemas/auth.schema";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y gestión de sesiones
 */

// Health check endpoint para CI/CD y Load Balancers
// Permite verificar rápidamente si el subsistema de auth está respondiendo sin lógica pesada.
/**
 * @swagger
 * /auth/health:
 *   get:
 *     summary: Check de salud del servicio
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Servicio operativo
 */
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// --- Rutas Públicas ---

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rut
 *               - password
 *             properties:
 *               rut:
 *                 type: string
 *                 example: "12345678-9"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login exitoso. Retorna tokens y usuario.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               description: HttpOnly cookie con refresh_token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenciales inválidas
 */
router.post(
  "/login",
  authLimiter, // Rate Limiting: Prevención de ataques de fuerza bruta
  validateSchema(loginSchema), // Validación temprana de esquema
  authController.login,
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refrescar access token
 *     description: Usa la cookie httpOnly 'jwt' para obtener un nuevo access token.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refrescado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *       401:
 *         description: No autorizado o token expirado
 *       403:
 *         description: Token inválido
 */
router.post("/refresh", authController.refresh);

// --- Rutas Protegidas ---
// Todo lo definido a partir de aquí requiere un JWT válido en el header Authorization.
router.use(authMiddleware);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Cambiar contraseña
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 */
router.post(
  "/change-password",
  validateSchema(changePasswordSchema),
  authController.changePassword,
);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       204:
 *         description: Logout exitoso (Cookie eliminada)
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /auth/user:
 *   get:
 *     summary: Obtener usuario actual
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 */
router.get("/user", authController.user);

/**
 * @swagger
 * /auth/history:
 *   get:
 *     summary: Obtener historial de inicios de sesión
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de últimos inicios de sesión
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LoginHistory'
 *       401:
 *         description: No autorizado
 */
router.get("/history", authController.getHistory);

export default router;

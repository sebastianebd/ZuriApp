import express from "express";
import userController from "../../controllers/user.controller";
import authMiddleware, {
  requirePermission,
} from "../../middleware/authentication.middleware"; // Fixed import: requirePermission was pulled from default export in original? checking context.
// Actually original had explicit import below. Cleaning up imports.

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios del sistema
 */

// Middleware de Seguridad: Todo CRUD de usuarios requiere autenticación previa.
router.use(authMiddleware);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       409:
 *         description: Usuario ya existe
 */

import { validateSchema } from "../../middleware/validate.middleware";
import { createUserSchema, updateUserSchema } from "../../schemas/user.schema";

// --- Creación de Usuarios ---
// Requiere permiso 'users.create'.
// Se valida contra esquema Zod antes de pasar al controlador.
router.post(
  "/",
  requirePermission("users.create"),
  validateSchema(createUserSchema),
  userController.register,
);

/**
 * ...
 */
router.put(
  "/:id",
  requirePermission("users.update"),
  validateSchema(updateUserSchema),
  userController.actualizarUsuario,
);
/**
 * ...
 */
router.get("/", requirePermission("users.view"), userController.mostrarTodos);
/**
 * ...
 */
router.get(
  "/tens",
  requirePermission("users.view"),
  userController.mostrarUsuarios,
);
/**
 * ...
 */
router.delete(
  "/:id",
  requirePermission("users.delete"),
  userController.eliminarUsuario,
);

export default router;

const express = require("express");
const router = express.Router();
const userController = require("../../controllers/user.controller");
const authMiddleware = require("../../middleware/authentication.middleware");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios del sistema
 */
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

router.post("/", userController.register);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
router.put("/:id", userController.actualizarUsuario);
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listar todos los usuarios
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get("/", userController.mostrarTodos);
/**
 * @swagger
 * /users/tens:
 *   get:
 *     summary: Listar usuarios con cargo TENS
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de TENS
 */
router.get("/tens", userController.mostrarUsuarios);
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */
router.delete("/:id", userController.eliminarUsuario);

module.exports = router;

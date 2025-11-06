const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const authMiddleware = require('../../middleware/authentication.middleware');

router.use(authMiddleware);

router.post('/', userController.register);
router.put('/:id', userController.actualizarUsuario);
router.get('/', userController.mostrarTodos);
router.get('/tens', userController.mostrarUsuarios);
router.delete('/:id', userController.eliminarUsuario);

module.exports = router;

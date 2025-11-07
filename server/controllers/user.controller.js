const userService = require('../services/user.service');

async function register(req, res) {
  try {
    const data = await userService.register(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(error.status || 400).json({ mensaje: error.message });
  }
}

async function mostrarUsuarios(req, res) {
  const usuarios = await userService.obtenerUsuariosTENS();
  res.json(usuarios);
}

async function mostrarTodos(req, res) {
  const usuarios = await userService.obtenerTodos();
  res.json(usuarios);
}

async function actualizarUsuario(req, res) {
  try {
    const usuarios = await userService.actualizar(req.params.id, req.body);
    res.json(usuarios);
  } catch (error) {
    res.status(error.status || 400).json({ mensaje: error.message });
  }
}

async function eliminarUsuario(req, res) {
  try {
    const usuarios = await userService.eliminar(req.params.id);
    res.json(usuarios);
  } catch (error) {
    res.status(error.status || 400).json({ mensaje: error.message });
  }
}

module.exports = {
  register,
  mostrarUsuarios,
  mostrarTodos,
  actualizarUsuario,
  eliminarUsuario,
};

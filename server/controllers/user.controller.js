const userService = require("../services/user.service");
const auditService = require("../services/audit.service");

async function register(req, res) {
  try {
    const data = await userService.register(req.body);
    // Log Auditoría
    await auditService.logAction(
      "CREAR",
      "USUARIOS",
      req.user,
      `Se creó al usuario RUT ${req.body.rut}`,
      req.body,
      data._id
    );
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
    const original = await userService.obtenerPorId(req.params.id);
    const usuarios = await userService.actualizar(req.params.id, req.body);

    // Log Auditoría (Diff)
    const diff = auditService.generateDiff(original, req.body);
    const nombreUsuario = original
      ? `${original.nombre} ${original.apellido}`
      : `ID ${req.params.id}`;
    const descripcion = diff
      ? `Se modificó al usuario ${nombreUsuario} (Cambios: ${diff})`
      : `Se modificó al usuario ${nombreUsuario} (Sin cambios detectados)`;

    await auditService.logAction(
      "MODIFICAR",
      "USUARIOS",
      req.user,
      descripcion,
      req.body,
      req.params.id
    );
    res.json(usuarios);
  } catch (error) {
    res.status(error.status || 400).json({ mensaje: error.message });
  }
}

async function eliminarUsuario(req, res) {
  try {
    const usuarios = await userService.eliminar(req.params.id);
    // Log Auditoría
    await auditService.logAction(
      "ELIMINAR",
      "USUARIOS",
      req.user,
      `Se eliminó al usuario ID ${req.params.id}`,
      null,
      req.params.id
    );
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

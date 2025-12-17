const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/user.model");

async function register(data) {
  const {
    rut,
    nombre,
    apellido,
    fecha_nac,
    direccion,
    telefono,
    email,
    ciudad,
    tipo_cargo,
  } = data;

  const exists = await Promise.all([
    User.exists({ rut }),
    User.exists({ telefono }),
    User.exists({ email }),
  ]);

  if (exists.some(Boolean))
    throw { status: 409, message: "Usuario ya registrado" };

  const generarPassword = crypto.randomBytes(3).toString("hex");
  const hashedPassword = await bcrypt.hash(generarPassword, 10);

  const nuevoUsuario = {
    rut,
    nombre,
    apellido,
    fecha_nac,
    direccion,
    telefono,
    email,
    ciudad,
    tipo_cargo,
    password: hashedPassword,
  };

  if (tipo_cargo === "TENS") nuevoUsuario.habilitado = data.habilitado;
  if (tipo_cargo === "JEFA SERVICIO") nuevoUsuario.servicio = data.servicio;

  await User.create(nuevoUsuario);

  console.log("nuevo usuario en el service: ", nuevoUsuario);
  return nuevoUsuario;
}

// Función para obtener todos los usuarios Reemplazantes
async function obtenerUsuariosTENS() {
  return await User.find({
    eliminado: false,
    tipo_cargo: { $ne: "ADMIN-TI", $ne: "RECURSOS HUMANOS" },
  });
}

async function obtenerPorId(id) {
  return await User.findById(id).lean();
}

async function obtenerTodos() {
  return await User.find({ eliminado: false });
}

async function actualizar(id, data) {
  await User.findByIdAndUpdate(id, data, { new: true });
  return await User.find({ eliminado: false });
}

async function eliminar(id) {
  await User.findByIdAndUpdate(id, { eliminado: true }, { new: true });
  return await User.find({ eliminado: { $ne: true } });
}

module.exports = {
  register,
  obtenerUsuariosTENS,
  obtenerTodos,
  actualizar,
  eliminar,
  obtenerPorId,
};

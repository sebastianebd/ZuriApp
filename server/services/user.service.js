const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'zuri.app01@gmail.com',
    pass: 'password2023!',
  },
});

async function register(data) {
  const { rut, nombre, apellido, fecha_nac, direccion, telefono, email, ciudad, tipo_cargo } = data;

  const exists = await Promise.all([
    User.exists({ rut }),
    User.exists({ telefono }),
    User.exists({ email }),
  ]);

  if (exists.some(Boolean)) throw { status: 409, message: 'Usuario ya registrado' };

  const generarPassword = crypto.randomBytes(3).toString('hex');
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

  if (tipo_cargo === 'TENS') nuevoUsuario.habilitado = data.habilitado;
  if (tipo_cargo === 'JEFA SERVICIO') nuevoUsuario.servicio = data.servicio;

  await User.create(nuevoUsuario);

  await transporter.sendMail({
    from: 'zuri.app01@gmail.com',
    to: email,
    subject: 'Contraseña generada automáticamente',
    text: `¡Hola ${nombre}! Tu contraseña es: ${generarPassword}`,
  });
}

async function obtenerUsuariosTENS() {
  return await User.find({ tipo_cargo: 'TENS' });
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

module.exports = { register, obtenerUsuariosTENS, obtenerTodos, actualizar, eliminar };

import bcrypt from "bcrypt";
import crypto from "crypto";
import User, { IUser } from "../models/user.model";
import logger from "../config/logger.config";

interface RegisterData {
  rut: string;
  nombre: string;
  apellido: string;
  fecha_nac: Date | string;
  direccion: string;
  telefono: string;
  email: string;
  ciudad: string;
  tipo_cargo: string;
  habilitado?: string;
  servicio?: string;
}

async function register(data: RegisterData) {
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

  const nuevoUsuario: any = {
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

  logger.info(`Nuevo usuario registrado en service: ${nuevoUsuario.rut}`);
  return nuevoUsuario;
}

async function obtenerUsuariosTENS() {
  return await User.find({
    eliminado: false,
    tipo_cargo: { $nin: ["ADMIN-TI", "RECURSOS HUMANOS"] }, // Changed $ne chaining to $nin for cleaner syntax
  });
}

async function obtenerPorId(id: string) {
  return await User.findById(id).lean();
}

async function obtenerTodos() {
  return await User.find({ eliminado: false });
}

async function actualizar(id: string, data: Partial<IUser>) {
  await User.findByIdAndUpdate(id, data, { new: true });
  return await User.find({ eliminado: false });
}

async function eliminar(id: string) {
  await User.findByIdAndUpdate(id, { eliminado: true }, { new: true });
  return await User.find({ eliminado: { $ne: true } });
}

export default {
  register,
  obtenerUsuariosTENS,
  obtenerTodos,
  actualizar,
  eliminar,
  obtenerPorId,
};

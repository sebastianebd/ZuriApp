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

async function register(data: RegisterData, creatorRole: string) {
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

  // 1. Permission Validation
  if (
    creatorRole === "RECURSOS HUMANOS" &&
    ["ADMIN-TI", "RECURSOS HUMANOS"].includes(tipo_cargo)
  ) {
    throw {
      status: 403,
      message:
        "No tienes permisos para crear usuarios con acceso al sistema (ADMIN-TI o RRHH)",
    };
  }

  const exists = await Promise.all([
    User.exists({ rut }),
    User.exists({ telefono }),
    User.exists({ email }),
  ]);

  if (exists.some(Boolean))
    throw { status: 409, message: "Usuario ya registrado" };

  // 2. Conditional Password Generation
  let hashedPassword = undefined;
  const rolesWithPassword = ["ADMIN-TI", "RECURSOS HUMANOS"];

  if (rolesWithPassword.includes(tipo_cargo)) {
    const generarPassword = crypto.randomBytes(3).toString("hex");
    hashedPassword = await bcrypt.hash(generarPassword, 10);
    // TODO: Send email with credentials here (placeholder)
    logger.info(`Generated password for ${rut} (${tipo_cargo})`);
  }

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

  // Sanitize password if undefined to prevent DB issues
  if (nuevoUsuario.password === undefined) {
    delete nuevoUsuario.password;
  }

  const userCreated = await User.create(nuevoUsuario);

  logger.info(`Nuevo usuario registrado en service: ${userCreated.rut}`);
  return userCreated;
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

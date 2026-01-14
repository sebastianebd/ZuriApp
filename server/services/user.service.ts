import bcrypt from "bcrypt";
import crypto from "crypto";
import User, { IUser } from "../models/user.model";
import logger from "../config/logger.config";
// import emailService from "./email.service"; // Decoupled: used by Worker now
import { emailQueue } from "../queues/email.queue";

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

  // Normalize data for checks
  const normalizedRut = rut.toUpperCase();
  const normalizedEmail = email.toLowerCase();
  // Phone usually doesn't need casing, but trim is good
  const normalizedTelef = telefono.trim(); // Assuming we rely on frontend +56

  // 2. Validate Uniqueness
  if (await User.exists({ rut: normalizedRut })) {
    throw { status: 409, message: "El RUT ya está registrado." };
  }
  if (await User.exists({ email: normalizedEmail })) {
    throw { status: 409, message: "Ya existe un usuario con ese email." };
  }
  if (await User.exists({ telefono: normalizedTelef })) {
    throw { status: 409, message: "Ya existe un usuario con ese teléfono." };
  }

  // 2. Conditional Password Generation
  let hashedPassword = undefined;
  const rolesWithPassword = ["ADMIN-TI", "RECURSOS HUMANOS"];

  if (rolesWithPassword.includes(tipo_cargo)) {
    const generarPassword = crypto.randomBytes(3).toString("hex");
    hashedPassword = await bcrypt.hash(generarPassword, 10);

    // Dispatch email job to Queue (Fire and Forget)
    await emailQueue.add("send-welcome-email", {
      to: normalizedEmail,
      nombre: `${nombre} ${apellido}`,
      rut: normalizedRut,
      pass: generarPassword,
    });

    logger.info(`Generated password for ${normalizedRut} (${tipo_cargo})`);
  }

  const nuevoUsuario: any = {
    rut: normalizedRut,
    nombre: nombre.toUpperCase(),
    apellido: apellido.toUpperCase(),
    fecha_nac,
    direccion: direccion.toUpperCase(),
    telefono: normalizedTelef,
    email: normalizedEmail,
    ciudad: ciudad.toUpperCase(),
    tipo_cargo,
    password: hashedPassword,
  };

  if (tipo_cargo === "TENS") nuevoUsuario.habilitado = data.habilitado;
  if (tipo_cargo === "JEFA SERVICIO") nuevoUsuario.servicio = data.servicio;

  // Sanitize password if undefined to prevent DB issues
  if (nuevoUsuario.password === undefined) {
    delete nuevoUsuario.password;
  }

  let userCreated;
  try {
    userCreated = await User.create(nuevoUsuario);
  } catch (error: any) {
    if (error.code === 11000) {
      if (error.keyPattern.rut)
        throw { status: 409, message: "El RUT ya está registrado." };
      if (error.keyPattern.email)
        throw { status: 409, message: "Ya existe un usuario con ese email." };
      if (error.keyPattern.telefono)
        throw {
          status: 409,
          message: "Ya existe un usuario con ese teléfono.",
        };
    }
    throw error;
  }

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

async function obtenerTodos(allowedCargos?: string[]) {
  const query: any = { eliminado: false };

  // If filter is provided, restrict query.
  // If empty array passed, it means user sees nothing (correct).
  if (allowedCargos && Array.isArray(allowedCargos)) {
    query.tipo_cargo = { $in: allowedCargos };
  }

  return await User.find(query);
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

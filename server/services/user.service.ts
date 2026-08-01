import bcrypt from "bcrypt";
import crypto from "crypto";
import User, { IUser } from "../models/user.model";
import logger from "../config/logger.config";
import { emailQueue } from "../queues/email.queue";
import { AppError } from "../errors/app-error";
import { escapeRegex } from "../utils/regex";

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

  // 1. Validación de Jerarquía de Roles
  // Evitamos escalada de privilegios: Un usuario RRHH no puede crear otros Administradores.
  if (
    creatorRole === "RECURSOS HUMANOS" &&
    ["ADMIN-TI", "RECURSOS HUMANOS"].includes(tipo_cargo)
  ) {
    throw new AppError(
      403,
      "No tienes permisos para crear usuarios con acceso al sistema (ADMIN-TI o RRHH)",
    );
  }

  // Normalización de Datos
  const normalizedRut = rut.toUpperCase();
  const normalizedEmail = email.toLowerCase();
  const normalizedTelef = telefono.trim(); // Confiamos en validación del frontend (+56)

  // 2. Verificaciones Unicidad
  // Chequeos explícitos antes de intentar guardar para dar mensajes de error amigables.
  if (await User.exists({ rut: normalizedRut })) {
    throw new AppError(409, "El RUT ya está registrado.");
  }
  if (await User.exists({ email: normalizedEmail })) {
    throw new AppError(409, "Ya existe un usuario con ese email.");
  }
  if (await User.exists({ telefono: normalizedTelef })) {
    throw new AppError(409, "Ya existe un usuario con ese teléfono.");
  }

  // 3. Generación del One-Time Link de Activación (Item 1)
  // Los cargos administrativos reciben un link seguro en lugar de una contraseña en plano.
  // El link expira en 24h. La cuenta queda inactiva hasta que el usuario fije su propia clave.
  const rolesWithPassword = ["ADMIN-TI", "RECURSOS HUMANOS"];

  // Objeto base del usuario (sin password — el token de activación es la credencial inicial)
  const nuevoUsuarioBase: any = {
    rut: normalizedRut,
    nombre: nombre.toUpperCase(),
    apellido: apellido.toUpperCase(),
    fecha_nac,
    direccion: direccion.toUpperCase(),
    telefono: normalizedTelef,
    email: normalizedEmail,
    ciudad: ciudad.toUpperCase(),
    tipo_cargo,
  };

  if (tipo_cargo === "TENS") nuevoUsuarioBase.habilitado = data.habilitado;
  if (tipo_cargo === "JEFA SERVICIO") nuevoUsuarioBase.servicio = data.servicio;

  if (rolesWithPassword.includes(tipo_cargo)) {
    // Generación del token — el rawToken va al correo, el hash a la BD (según el plan)
    const { generateResetToken } = await import("./auth.service");
    const tempUser = await User.create({ ...nuevoUsuarioBase });
    const { rawToken } = await generateResetToken(tempUser._id.toString());
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/setup-password?token=${rawToken}`;

    await emailQueue.add("send-welcome-email", {
      to: normalizedEmail,
      nombre: `${nombre} ${apellido}`,
      rut: normalizedRut,
      resetLink,
    });

    logger.info(`One-Time Link generado para ${normalizedRut} (${tipo_cargo})`);
    return tempUser;
  }

  // Usuarios operativos (sin acceso al sistema): se crean directamente sin password
  const nuevoUsuario = { ...nuevoUsuarioBase };

  let userCreated;
  try {
    userCreated = await User.create(nuevoUsuario);
  } catch (error: any) {
    // Manejo de Race Conditions: Si dos requests pasaron la validación previa simultáneamente.
    if (error.code === 11000) {
      if (error.keyPattern.rut)
        throw new AppError(409, "El RUT ya está registrado.");
      if (error.keyPattern.email)
        throw new AppError(409, "Ya existe un usuario con ese email.");
      if (error.keyPattern.telefono)
        throw new AppError(409, "Ya existe un usuario con ese teléfono.");
    }
    throw error;
  }

  logger.info(`Nuevo usuario registrado en service: ${userCreated.rut}`);
  return userCreated;
}

async function obtenerUsuariosTENS() {
  return await User.find({
    eliminado: false,
    tipo_cargo: { $nin: ["ADMIN-TI", "RECURSOS HUMANOS"] }, // Excluye admins
  });
}

async function obtenerPorId(id: string) {
  return await User.findById(id).lean();
}

async function obtenerTodos(allowedCargos?: string[], search?: string) {
  const query: any = { eliminado: false };

  // Filtro de Seguridad por Rol
  if (allowedCargos && Array.isArray(allowedCargos)) {
    query.tipo_cargo = { $in: allowedCargos };
  }

  // Búsqueda Optimizada (Prefix Match)
  // Aprovecha índices B-tree si existen en rut/nombre/apellido.
  if (search && search.trim().length > 0) {
    const terms = search.trim().toUpperCase().split(/\s+/);

    // Estrategia Multi-Término: Cada palabra debe coincidir en AL MENOS un campo.
    const andConditions = terms.map((term) => {
      const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp("^" + safeTerm); // Anchor ^ para rendimiento

      return {
        $or: [
          { rut: regex },
          { nombre: regex },
          { apellido: regex },
          { tipo_cargo: regex },
        ],
      };
    });

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }
  }

  return await User.find(query);
}

// Paginación Servidor
async function obtenerTodosPaginado(options: {
  allowedCargos?: string[];
  search?: string;
  cargo?: string;
  habilitado?: string;
  rut?: string;
  page: number;
  limit: number;
}) {
  const { allowedCargos, search, page, limit } = options;
  const query: any = { eliminado: false };

  if (allowedCargos && Array.isArray(allowedCargos)) {
    query.tipo_cargo = { $in: allowedCargos };
  }

  if (search && search.trim().length > 0) {
    const terms = search.trim().toUpperCase().split(/\s+/);

    const andConditions = terms.map((term) => {
      const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp("^" + safeTerm);

      return {
        $or: [{ rut: regex }, { nombre: regex }, { apellido: regex }],
      };
    });

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }
  }

  // --- Filtros Específicos ---
  if (options.cargo && options.cargo.trim() !== "") {
    query.tipo_cargo = options.cargo;
  }

  if (options.habilitado && options.habilitado.trim() !== "") {
    query.habilitado = options.habilitado;
  }

  if (options.rut && options.rut.trim() !== "") {
    // C1 ReDoS fix: escape user input before using in RegExp
    query.rut = { $regex: new RegExp(escapeRegex(options.rut.toUpperCase()), "i") };
  }

  const skip = (page - 1) * limit;

  // Ejecución Paralela: Query + Count
  const [usuarios, total] = await Promise.all([
    User.find(query)
      .select("-password") // Seguridad: Excluir hash
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    usuarios,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
    },
  };
}

async function actualizar(id: string, data: Partial<IUser>) {
  await User.findByIdAndUpdate(id, data, { new: true });
  return await User.find({ eliminado: false });
}

async function eliminar(id: string) {
  // Soft Delete:
  // Nunca borramos físicamente usuarios para mantener integridad referencial de auditoría e historial.
  await User.findByIdAndUpdate(id, { eliminado: true }, { new: true });
  return await User.find({ eliminado: { $ne: true } });
}

/**
 * Disparado por el Admin (botones del perfil): Genera un nuevo One-Time Link
 * para un usuario existente e invalida cualquier link anterior.
 * Permíso requerido: users.reset_password (RBAC granular).
 */
async function sendResetLink(userId: string): Promise<void> {
  const user = await User.findById(userId).select("email nombre apellido rut tipo_cargo");
  if (!user) {
    throw new AppError(404, "Usuario no encontrado");
  }

  const rolesWithPassword = ["ADMIN-TI", "RECURSOS HUMANOS"];
  if (!rolesWithPassword.includes(user.tipo_cargo)) {
    throw new AppError(400, "Este usuario no tiene acceso al sistema");
  }

  const { generateResetToken } = await import("./auth.service");
  const { rawToken } = await generateResetToken(user._id.toString());
  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/setup-password?token=${rawToken}`;

  await emailQueue.add("send-welcome-email", {
    to: user.email,
    nombre: `${user.nombre} ${user.apellido}`,
    rut: user.rut,
    resetLink,
    isReset: true,
  });

  logger.info(`Reset link enviado por Admin para ${user.rut}`);
}

export default {
  register,
  obtenerUsuariosTENS,
  obtenerTodos,
  obtenerTodosPaginado,
  actualizar,
  eliminar,
  obtenerPorId,
  sendResetLink,
};

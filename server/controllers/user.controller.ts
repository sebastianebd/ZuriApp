import { Request, Response } from "express";
import userService from "../services/user.service";
import auditService from "../services/audit.service";
import { AuthRequest } from "../middleware/authentication.middleware";
import { get, set, delPattern } from "../config/redis.config";
import socketIO from "../config/socket";

async function register(req: AuthRequest, res: Response) {
  try {
    const data = await userService.register(
      req.body,
      req.user?.tipo_cargo || "",
    );
    await auditService.logAction(
      "CREAR",
      "Funcionarios",
      req.user,
      `Se creó al usuario RUT ${req.body.rut} ${req.body.nombre} ${req.body.apellido}`,
      req.body,
      data._id as string,
    );
    await delPattern("users:*");

    try {
      const io = socketIO.getIO();
      io.emit("users:update", { action: "create", user: data });
    } catch (err) {}

    res.status(201).json(data);
  } catch (error: any) {
    res.status(error.status || 400).json({ mensaje: error.message });
  }
}

async function mostrarUsuarios(req: Request, res: Response) {
  try {
    const cacheKey = "users:tens";
    const cachedData = await get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const usuarios = await userService.obtenerUsuariosTENS();
    await set(cacheKey, usuarios, 300);
    res.json(usuarios);
  } catch (error: any) {
    res.status(error.status || 500).json({ mensaje: error.message });
  }
}

import Cargo from "../models/cargo.model";

// Updated signature to AuthRequest
async function mostrarTodos(req: AuthRequest, res: Response) {
  try {
    const userRole = req.user?.tipo_cargo || "UNKNOWN";

    // Paginación Estándar
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";

    const cargo = (req.query.cargo as string) || "";
    const habilitado = (req.query.habilitado as string) || "";
    const rut = (req.query.rut as string) || "";

    // Key de Caché Compuesta
    // Debe incluir TODOS los factores de variabilidad, incluidos los roles del solicitante,
    // ya que diferentes roles ven diferentes subconjuntos de datos.
    const cacheKey = `users:p${page}:l${limit}:s${search || "none"}:c${cargo}:h${habilitado}:rt${rut}:r${userRole}`;

    // 1. Estrategia de Caché (Read-Through)
    const cachedData = await get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // 2. Capa de Visibilidad (Invisibility Layer)
    // Regla de Seguridad: Un usuario solo puede ver funcionarios de jerarquía INFERIOR a la suya,
    // a menos que sea Admin (Nivel 100).
    let allowedCargos: string[] | undefined = undefined;

    const myCargo = await Cargo.findOne({ nombre: userRole });
    const myLevel = myCargo?.nivel || 0;

    if (myLevel < 100) {
      // Filtramos la query a MongoDB para traer solo cargos con nivel estricto menor (<)
      const visibleCargos = await Cargo.find({
        nivel: { $lt: myLevel },
      }).select("nombre");
      allowedCargos = visibleCargos.map((c) => c.nombre);
    }

    // 3. Consulta a Base de Datos
    const result = await userService.obtenerTodosPaginado({
      allowedCargos,
      search,
      cargo: req.query.cargo as string,
      habilitado: req.query.habilitado as string,
      rut: req.query.rut as string,
      page,
      limit,
    });

    // 4. Escritura en Caché (TTL Corto 60s)
    await set(cacheKey, result, 60);

    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({ mensaje: error.message });
  }
}

async function actualizarUsuario(req: AuthRequest, res: Response) {
  try {
    const original: any = await userService.obtenerPorId(req.params.id);
    const usuarios = await userService.actualizar(req.params.id, req.body);

    const diff = auditService.generateDiff(original, req.body);
    const nombreUsuario = original
      ? `${original.nombre} ${original.apellido}`
      : `ID ${req.params.id}`;
    const descripcion = diff
      ? `Se modificó al usuario ${nombreUsuario} (Cambios: ${diff})`
      : `Se modificó al usuario ${nombreUsuario} (Sin cambios detectados)`;

    await auditService.logAction(
      "MODIFICAR",
      "Funcionarios",
      req.user,
      descripcion,
      req.body,
      req.params.id,
    );
    await delPattern("users:*");

    try {
      const io = socketIO.getIO();
      io.emit("users:update", { action: "update", userId: req.params.id });
    } catch (err) {}

    res.json(usuarios);
  } catch (error: any) {
    res.status(error.status || 400).json({ mensaje: error.message });
  }
}

async function eliminarUsuario(req: AuthRequest, res: Response) {
  try {
    const userToDelete: any = await userService.obtenerPorId(req.params.id);
    const usuarios = await userService.eliminar(req.params.id);

    await auditService.logAction(
      "ELIMINAR",
      "Funcionarios",
      req.user,
      userToDelete
        ? `Se eliminó al usuario RUT ${userToDelete.rut} ${userToDelete.nombre} ${userToDelete.apellido}`
        : `Se eliminó al usuario ID ${req.params.id}`,
      null,
      req.params.id,
    );
    await delPattern("users:*");

    try {
      const io = socketIO.getIO();
      io.emit("users:update", { action: "delete", userId: req.params.id });
    } catch (err) {}

    res.json(usuarios);
  } catch (error: any) {
    res.status(error.status || 400).json({ mensaje: error.message });
  }
}

export default {
  register,
  mostrarUsuarios,
  mostrarTodos,
  actualizarUsuario,
  eliminarUsuario,
};

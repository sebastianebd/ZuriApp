import { Request, Response } from "express";
import userService from "../services/user.service";
import auditService from "../services/audit.service";
import { AuthRequest } from "../middleware/authentication.middleware";

async function register(req: AuthRequest, res: Response) {
  try {
    const data = await userService.register(req.body);
    await auditService.logAction(
      "CREAR",
      "USUARIOS",
      req.user,
      `Se creó al usuario RUT ${req.body.rut}`,
      req.body,
      data._id as string // assuming _id exists on returned data
    );
    res.status(201).json(data);
  } catch (error: any) {
    res.status(error.status || 400).json({ mensaje: error.message });
  }
}

async function mostrarUsuarios(req: Request, res: Response) {
  try {
    const usuarios = await userService.obtenerUsuariosTENS();
    res.json(usuarios);
  } catch (error: any) {
    res.status(error.status || 500).json({ mensaje: error.message });
  }
}

async function mostrarTodos(req: Request, res: Response) {
  try {
    const usuarios = await userService.obtenerTodos();
    res.json(usuarios);
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
      "USUARIOS",
      req.user,
      descripcion,
      req.body,
      req.params.id
    );
    res.json(usuarios);
  } catch (error: any) {
    res.status(error.status || 400).json({ mensaje: error.message });
  }
}

async function eliminarUsuario(req: AuthRequest, res: Response) {
  try {
    const usuarios = await userService.eliminar(req.params.id);
    await auditService.logAction(
      "ELIMINAR",
      "USUARIOS",
      req.user,
      `Se eliminó al usuario ID ${req.params.id}`,
      null,
      req.params.id
    );
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

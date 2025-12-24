import { Request, Response } from "express";
import optionService from "../services/option.service";

async function mostrarServicios(req: Request, res: Response) {
  try {
    const data = await optionService.obtener("SERVICIOS");
    res.json(data);
  } catch (error: any) {
    res.status(error.status || 500).json({ mensaje: error.message });
  }
}

async function mostrarTipoTurnos(req: Request, res: Response) {
  try {
    const data = await optionService.obtener("TIPO_TURNO");
    res.json(data);
  } catch (error: any) {
    res.status(error.status || 500).json({ mensaje: error.message });
  }
}

async function mostrarTipoCargo(req: Request, res: Response) {
  try {
    const data = await optionService.obtener("TIPO_CARGO");
    res.json(data);
  } catch (error: any) {
    res.status(error.status || 500).json({ mensaje: error.message });
  }
}

async function mostrarHabilitado(req: Request, res: Response) {
  try {
    const data = await optionService.obtener("HABILITADO");
    res.json(data);
  } catch (error: any) {
    res.status(error.status || 500).json({ mensaje: error.message });
  }
}

export default {
  mostrarServicios,
  mostrarTipoTurnos,
  mostrarTipoCargo,
  mostrarHabilitado,
};

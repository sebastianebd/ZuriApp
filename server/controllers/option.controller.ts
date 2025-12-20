import { Request, Response } from "express";
import optionService from "../services/option.service";

async function mostrarServicios(req: Request, res: Response) {
  const data = await optionService.obtener("SERVICIOS");
  res.json(data);
}

async function mostrarTipoTurnos(req: Request, res: Response) {
  const data = await optionService.obtener("TIPO_TURNO");
  res.json(data);
}

async function mostrarTipoCargo(req: Request, res: Response) {
  const data = await optionService.obtener("TIPO_CARGO");
  res.json(data);
}

async function mostrarHabilitado(req: Request, res: Response) {
  const data = await optionService.obtener("HABILITADO");
  res.json(data);
}

export default {
  mostrarServicios,
  mostrarTipoTurnos,
  mostrarTipoCargo,
  mostrarHabilitado,
};

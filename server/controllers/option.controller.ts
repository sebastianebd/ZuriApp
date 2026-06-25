import { Request, Response } from "express";
import optionService from "../services/option.service";

/**
 * Controladores de Opciones (Dropdowns/Selects)
 * Estos endpoints actúan como passthrough directos a servicios de configuración.
 * Se mantienen separados para permitir caching agresivo a nivel de HTTP o CDN en el futuro,
 * ya que son datos de "baja volatilidad".
 */

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

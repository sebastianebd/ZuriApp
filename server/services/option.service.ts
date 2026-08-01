import Option from "../models/option.model";
import Cargo from "../models/cargo.model";
import Service from "../models/service.model";
import TurnType from "../models/turn-type.model";
import { AppError } from "../errors/app-error";

type OptionResolver = () => Promise<string[]>;

// Registry Pattern:
// Mapea nombres de opciones clave hacia resolutores (handlers) específicos.
// Esto elimina la cadena de if/else y facilita la extensibilidad (O de SOLID).
const OPTION_REGISTRY: Record<string, OptionResolver> = {
  TIPO_CARGO: async () => {
    const cargos = await Cargo.find({ activo: true, deleted_at: null }).sort({
      nombre: 1,
    });
    return cargos.map((c: any) => c.nombre);
  },
  SERVICIOS: async () => {
    const services = await Service.find({
      activo: true,
      deleted_at: null,
    }).sort({
      nombre: 1,
    });
    return services.map((s: any) => s.nombre);
  },
  TIPO_TURNO: async () => {
    const turnTypes = await TurnType.find({
      activo: true,
      deleted_at: null,
    }).sort({ nombre: 1 });
    return turnTypes.map((t: any) => t.nombre);
  },
};

// Servicio Centralizado de Opciones (Dropdowns):
// Actúa como una fachada para obtener listas de opciones para el frontend.
async function obtener(nombre: string): Promise<string[]> {
  // 1. Intentamos resolver a través del Registry (Colecciones dedicadas)
  const resolver = OPTION_REGISTRY[nombre];
  if (resolver) {
    return await resolver();
  }

  // 2. Fallback: Colección Genérica 'Options'
  // Para listas simples que no requieren modelo propio (ej: "EstadoReemplazo", "MotivoRechazo").
  const option = await Option.findOne({ nombre }, "opciones");
  if (!option) throw new AppError(404, `No se encontraron ${nombre}`);
  
  return option.opciones;
}

export default { obtener };

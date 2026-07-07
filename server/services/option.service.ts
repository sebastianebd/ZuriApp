import Option, { IOption } from "../models/option.model";
import Cargo from "../models/cargo.model";
import Service from "../models/service.model";
import TurnType from "../models/turn-type.model";

// Servicio Centralizado de Opciones (Dropdowns):
// Este servicio actúa como una fachada para obtener listas de opciones para el frontend.
// Abstrae la fuente real de los datos:
// - Algunos vienen de colecciones dedicadas (Cargo, Service, TurnType) para integridad referencial.
async function obtener(nombre: string): Promise<string[]> {
  // Estrategia:
  // Interceptamos nombres clave ("TIPO_CARGO", "SERVICIOS", etc.) para delegar a sus modelos principales.
  // Esto mantiene la API limpia (/api/options/:name) sin exponer múltiples endpoints para cada recurso simple.

  if (nombre === "TIPO_CARGO") {
    // Solo mostramos cargos activos y no eliminados lógicamente
    const cargos = await Cargo.find({ activo: true, deleted_at: null }).sort({
      nombre: 1,
    });
    return cargos.map((c) => c.nombre);
  }

  if (nombre === "SERVICIOS") {
    const services = await Service.find({
      activo: true,
      deleted_at: null,
    }).sort({
      nombre: 1,
    });
    return services.map((s) => s.nombre);
  }

  if (nombre === "TIPO_TURNO") {
    const turnTypes = await TurnType.find({
      activo: true,
      deleted_at: null,
    }).sort({ nombre: 1 });
    return turnTypes.map((t) => t.nombre);
  }

  // Fallback: Colección Genérica 'Options'
  // Para listas simples que no requieren modelo propio (ej: "EstadoReemplazo", "MotivoRechazo").
  const option = await Option.findOne({ nombre }, "opciones");
  if (!option) throw { status: 404, message: `No se encontraron ${nombre}` };
  return option.opciones;
}

export default { obtener };

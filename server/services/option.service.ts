import Option, { IOption } from "../models/option.model";
import Cargo from "../models/cargo.model";
import Service from "../models/service.model";
import TurnType from "../models/turn-type.model";

async function obtener(nombre: string): Promise<string[]> {
  if (nombre === "TIPO_CARGO") {
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

  const option = await Option.findOne({ nombre }, "opciones");
  if (!option) throw { status: 404, message: `No se encontraron ${nombre}` };
  return option.opciones;
}

export default { obtener };

import Option, { IOption } from "../models/option.model";
import Cargo from "../models/cargo.model";

async function obtener(nombre: string): Promise<string[]> {
  if (nombre === "TIPO_CARGO") {
    const cargos = await Cargo.find({ activo: true }).sort({ nombre: 1 });
    return cargos.map((c) => c.nombre);
  }

  const option = await Option.findOne({ nombre }, "opciones");
  if (!option) throw { status: 404, message: `No se encontraron ${nombre}` };
  return option.opciones;
}

export default { obtener };

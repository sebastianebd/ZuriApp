import Option, { IOption } from "../models/option.model";

async function obtener(nombre: string): Promise<string[]> {
  const option = await Option.findOne({ nombre }, "opciones");
  if (!option) throw { status: 404, message: `No se encontraron ${nombre}` };
  return option.opciones;
}

export default { obtener };

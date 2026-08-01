import { describe, it, expect, vi, beforeEach } from "vitest";
import optionService from "../../services/option.service";
import Cargo from "../../models/cargo.model";
import Service from "../../models/service.model";
import TurnType from "../../models/turn-type.model";
import Option from "../../models/option.model";
import { AppError } from "../../errors/app-error";

vi.mock("../../models/cargo.model");
vi.mock("../../models/service.model");
vi.mock("../../models/turn-type.model");
vi.mock("../../models/option.model");

describe("Option Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debería devolver la lista de cargos (TIPO_CARGO)", async () => {
    (Cargo.find as any).mockReturnValue({
      sort: vi.fn().mockResolvedValue([{ nombre: "Admin" }, { nombre: "User" }])
    });

    const result = await optionService.obtener("TIPO_CARGO");
    expect(result).toEqual(["Admin", "User"]);
    expect(Cargo.find).toHaveBeenCalledWith({ activo: true, deleted_at: null });
  });

  it("debería devolver la lista de servicios (SERVICIOS)", async () => {
    (Service.find as any).mockReturnValue({
      sort: vi.fn().mockResolvedValue([{ nombre: "Urgencias" }])
    });

    const result = await optionService.obtener("SERVICIOS");
    expect(result).toEqual(["Urgencias"]);
    expect(Service.find).toHaveBeenCalledWith({ activo: true, deleted_at: null });
  });

  it("debería devolver la lista de turnos (TIPO_TURNO)", async () => {
    (TurnType.find as any).mockReturnValue({
      sort: vi.fn().mockResolvedValue([{ nombre: "Diurno" }])
    });

    const result = await optionService.obtener("TIPO_TURNO");
    expect(result).toEqual(["Diurno"]);
    expect(TurnType.find).toHaveBeenCalledWith({ activo: true, deleted_at: null });
  });

  it("debería devolver opciones genéricas de la colección Option", async () => {
    (Option.findOne as any).mockResolvedValue({
      opciones: ["Opcion A", "Opcion B"]
    });

    const result = await optionService.obtener("ESTADO_REEMPLAZO");
    expect(result).toEqual(["Opcion A", "Opcion B"]);
    expect(Option.findOne).toHaveBeenCalledWith({ nombre: "ESTADO_REEMPLAZO" }, "opciones");
  });

  it("debería lanzar AppError si no se encuentra la opción genérica", async () => {
    (Option.findOne as any).mockResolvedValue(null);
    await expect(optionService.obtener("INVALIDO")).rejects.toThrow(AppError);
  });
});

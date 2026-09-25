import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import ReplacementModel, { REPLACEMENT_AUDIT_FIELDS } from "../../models/replacement.model";
import { connect, closeDatabase, clearDatabase } from "../db-helper";

describe("Replacement Model - Causal de Ausencia (TDD RED)", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  const baseValidData = {
    id_saliente: new mongoose.Types.ObjectId(),
    rut_saliente: "12345678-9",
    nombre_saliente: "JUAN",
    apellido_saliente: "PEREZ",
    id_entrante: new mongoose.Types.ObjectId(),
    rut_entrante: "98765432-1",
    nombre_entrante: "MARIA",
    apellido_entrante: "GONZALEZ",
    tipo_turno: "4TO_TURNO",
    fecha_inicio: new Date("2026-09-01T08:00:00.000Z"),
    fecha_termino: new Date("2026-09-15T20:00:00.000Z"),
    servicio: new mongoose.Types.ObjectId(),
    creado_por: new mongoose.Types.ObjectId(),
  };

  it("debería asignar motivo 'OTRO' por defecto si no se provee (retrocompatibilidad)", async () => {
    const replacement = new ReplacementModel({
      ...baseValidData,
    });

    const saved = await replacement.save();
    expect((saved as any).motivo).toBe("OTRO");
  });

  it("debería guardar un motivo oficial válido y observaciones", async () => {
    const replacement = new ReplacementModel({
      ...baseValidData,
      motivo: "LICENCIA_MEDICA",
      observaciones: "Reposo médico por 15 días",
    });

    const saved = await replacement.save();
    const fetched = await ReplacementModel.findById(saved._id);
    expect((fetched as any).motivo).toBe("LICENCIA_MEDICA");
    expect((fetched as any).observaciones).toBe("Reposo médico por 15 días");
  });

  it("debería rechazar un motivo no permitido por el enum", async () => {
    const replacement = new ReplacementModel({
      ...baseValidData,
      motivo: "MOTIVO_INEXISTENTE",
    });

    await expect(replacement.save()).rejects.toThrow();
  });

  it("debería incluir 'motivo' y 'observaciones' en REPLACEMENT_AUDIT_FIELDS", () => {
    expect(REPLACEMENT_AUDIT_FIELDS).toContain("motivo");
    expect(REPLACEMENT_AUDIT_FIELDS).toContain("observaciones");
  });
});

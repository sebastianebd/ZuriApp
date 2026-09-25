import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { TurnAssignmentModel } from "../../models/turn-assignment.model";
import ReplacementModel from "../../models/replacement.model";
import { connect, closeDatabase, clearDatabase } from "../db-helper";

describe("TurnAssignment Model & Compound Indexes (TDD RED)", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("Validación de end_date en TurnAssignmentModel", () => {
    it("debería rechazar la creación de TurnAssignment si end_date no está presente", async () => {
      const assignment = new TurnAssignmentModel({
        staffId: new mongoose.Types.ObjectId(),
        service: new mongoose.Types.ObjectId(),
        turn_type: new mongoose.Types.ObjectId(),
        start_date: new Date("2026-09-01T00:00:00.000Z"),
      });

      await expect(assignment.save()).rejects.toThrow(/end_date/);
    });

    it("debería persistir exitosamente cuando start_date y end_date están presentes", async () => {
      const assignment = new TurnAssignmentModel({
        staffId: new mongoose.Types.ObjectId(),
        service: new mongoose.Types.ObjectId(),
        turn_type: new mongoose.Types.ObjectId(),
        start_date: new Date("2026-09-01T00:00:00.000Z"),
        end_date: new Date("2026-09-30T23:59:59.999Z"),
        snapshot_secuencia: [
          { dia: 1, sigla: "L", es_libre: false },
        ],
      });

      const saved = await assignment.save();
      expect(saved._id).toBeDefined();
      expect(saved.end_date).toEqual(new Date("2026-09-30T23:59:59.999Z"));
    });
  });

  describe("Índices Compuestos de Alto Rendimiento (< 5ms)", () => {
    it("debería tener definido el índice compuesto { service: 1, start_date: 1, end_date: 1 } en TurnAssignmentModel", () => {
      const indexes = TurnAssignmentModel.schema.indexes();
      const hasCompoundIndex = indexes.some(([fields]) => {
        return (
          fields.service === 1 &&
          fields.start_date === 1 &&
          fields.end_date === 1
        );
      });

      expect(hasCompoundIndex).toBe(true);
    });

    it("debería tener definido el índice compuesto { servicio: 1, fecha_inicio: 1, fecha_termino: 1 } en ReplacementModel", () => {
      const indexes = ReplacementModel.schema.indexes();
      const hasCompoundIndex = indexes.some(([fields]) => {
        return (
          fields.servicio === 1 &&
          fields.fecha_inicio === 1 &&
          fields.fecha_termino === 1
        );
      });

      expect(hasCompoundIndex).toBe(true);
    });
  });
});

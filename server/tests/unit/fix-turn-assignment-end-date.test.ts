import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { TurnAssignmentModel } from "../../models/turn-assignment.model";
import {
  calculateEndOfMonth,
  runFixEndDateMigration,
} from "../../migrations/fix-turn-assignment-end-date";
import { connect, closeDatabase, clearDatabase } from "../db-helper";

describe("Migration: fix-turn-assignment-end-date (TDD RED)", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("calculateEndOfMonth helper", () => {
    it("debería calcular correctamente el último día de un mes regular (e.g. Mayo -> 31)", () => {
      const start = new Date("2026-05-10T08:00:00.000Z");
      const end = calculateEndOfMonth(start);
      expect(end.getUTCFullYear()).toBe(2026);
      expect(end.getUTCMonth()).toBe(4); // Mayo es mes index 4
      expect(end.getUTCDate()).toBe(31);
      expect(end.getUTCHours()).toBe(23);
      expect(end.getUTCMinutes()).toBe(59);
      expect(end.getUTCSeconds()).toBe(59);
    });

    it("debería calcular correctamente el último día de Febrero en año no bisiesto (2025 -> 28)", () => {
      const start = new Date("2025-02-05T08:00:00.000Z");
      const end = calculateEndOfMonth(start);
      expect(end.getUTCFullYear()).toBe(2025);
      expect(end.getUTCMonth()).toBe(1); // Febrero
      expect(end.getUTCDate()).toBe(28);
    });

    it("debería calcular correctamente el último día de Febrero en año bisiesto (2024 -> 29)", () => {
      const start = new Date("2024-02-15T08:00:00.000Z");
      const end = calculateEndOfMonth(start);
      expect(end.getUTCFullYear()).toBe(2024);
      expect(end.getUTCMonth()).toBe(1); // Febrero
      expect(end.getUTCDate()).toBe(29);
    });
  });

  describe("runFixEndDateMigration execution", () => {
    it("debería rellenar end_date para registros históricos donde end_date es nulo o no existe", async () => {
      // Inserción directa en la colección usando MongoDB driver nativo para bypass de validaciones Mongoose
      const collection = mongoose.connection.collection("turnassignments");

      const doc1 = {
        _id: new mongoose.Types.ObjectId(),
        staffId: new mongoose.Types.ObjectId(),
        service: new mongoose.Types.ObjectId(),
        turn_type: new mongoose.Types.ObjectId(),
        start_date: new Date("2026-05-10T08:00:00.000Z"),
        end_date: null,
      };

      const doc2 = {
        _id: new mongoose.Types.ObjectId(),
        staffId: new mongoose.Types.ObjectId(),
        service: new mongoose.Types.ObjectId(),
        turn_type: new mongoose.Types.ObjectId(),
        start_date: new Date("2026-09-01T08:00:00.000Z"),
        // Sin end_date ($exists: false)
      };

      const docWithEndDate = {
        _id: new mongoose.Types.ObjectId(),
        staffId: new mongoose.Types.ObjectId(),
        service: new mongoose.Types.ObjectId(),
        turn_type: new mongoose.Types.ObjectId(),
        start_date: new Date("2026-07-01T08:00:00.000Z"),
        end_date: new Date("2026-07-15T23:59:59.999Z"),
      };

      await collection.insertMany([doc1, doc2, docWithEndDate]);

      const result = await runFixEndDateMigration();
      expect(result.updatedCount).toBe(2);

      const updated1 = await collection.findOne({ _id: doc1._id });
      expect(updated1?.end_date).toEqual(new Date("2026-05-31T23:59:59.999Z"));

      const updated2 = await collection.findOne({ _id: doc2._id });
      expect(updated2?.end_date).toEqual(new Date("2026-09-30T23:59:59.999Z"));

      const unchanged = await collection.findOne({ _id: docWithEndDate._id });
      expect(unchanged?.end_date).toEqual(new Date("2026-07-15T23:59:59.999Z"));

      // Idempotencia: segunda corrida reporta 0 documentos pendientes
      const secondResult = await runFixEndDateMigration();
      expect(secondResult.updatedCount).toBe(0);
    });
  });
});

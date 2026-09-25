import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import Position from "../../models/position.model";
import { resolveEstamento, runEstamentosMigration } from "../../migrations/set-default-estamentos";
import { connect, closeDatabase, clearDatabase } from "../db-helper";

describe("Migration: set-default-estamentos Unit Tests", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("resolveEstamento helper", () => {
    it("debería mapear cargos médicos a 'MEDICO'", () => {
      expect(resolveEstamento("MEDICO CIRUJANO", "MED")).toBe("MEDICO");
      expect(resolveEstamento("Médico Urgencias", "XYZ")).toBe("MEDICO");
    });

    it("debería mapear TENS o técnicos a 'TECNICO'", () => {
      expect(resolveEstamento("TENS", "TNS")).toBe("TECNICO");
      expect(resolveEstamento("Técnico Paramédico", "TEC")).toBe("TECNICO");
    });

    it("debería mapear auxiliares a 'AUXILIAR'", () => {
      expect(resolveEstamento("AUXILIAR DE SERVICIO", "AUX")).toBe("AUXILIAR");
    });

    it("debería mapear administrativos o secretarias a 'ADMINISTRATIVO'", () => {
      expect(resolveEstamento("SECRETARIA CLÍNICA", "SEC")).toBe("ADMINISTRATIVO");
      expect(resolveEstamento("ADMINISTRATIVO ADMISIÓN", "ADM")).toBe("ADMINISTRATIVO");
    });

    it("debería resolver 'PROFESIONAL' para otros cargos clínicos (Enfermera, Kinesiólogo, etc.)", () => {
      expect(resolveEstamento("ENFERMERA", "ENF")).toBe("PROFESIONAL");
      expect(resolveEstamento("KINESIOLOGO", "KIN")).toBe("PROFESIONAL");
    });
  });

  describe("runEstamentosMigration", () => {
    it("debería migrar cargos existentes con estamento por defecto al correspondiente", async () => {
      await Position.create([
        { name: "MEDICO", position_code: "MED", estamento: "PROFESIONAL" },
        { name: "TENS", position_code: "TNS", estamento: "PROFESIONAL" },
        { name: "AUXILIAR", position_code: "AUX", estamento: "PROFESIONAL" },
      ]);

      const result = await runEstamentosMigration();
      expect(result.updatedCount).toBe(3);

      const med = await Position.findOne({ position_code: "MED" });
      expect(med?.estamento).toBe("MEDICO");

      const tens = await Position.findOne({ position_code: "TNS" });
      expect(tens?.estamento).toBe("TECNICO");

      const aux = await Position.findOne({ position_code: "AUX" });
      expect(aux?.estamento).toBe("AUXILIAR");

      // Idempotencia: una segunda corrida no debe actualizar nada
      const secondRun = await runEstamentosMigration();
      expect(secondRun.updatedCount).toBe(0);
    });
  });
});

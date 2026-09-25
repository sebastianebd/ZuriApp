import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import Position, { POSITION_AUDIT_FIELDS } from "../../models/position.model";
import { createPositionSchema, updatePositionSchema } from "../../schemas/position.schema";
import { connect, closeDatabase, clearDatabase } from "../db-helper";

describe("Position Model & Schema - Estamento Tests (TDD RED)", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("Modelo Mongoose (Position)", () => {
    it("debería asignar estamento 'PROFESIONAL' por defecto si no se especifica", async () => {
      const position = new Position({
        name: "Enfermera Clínica",
        position_code: "ENF_CLI",
      });
      await position.save();

      const saved = await Position.findById(position._id);
      expect(saved).toBeDefined();
      expect((saved as any).estamento).toBe("PROFESIONAL");
    });

    it("debería permitir guardar los 5 estamentos hospitalarios oficiales válidos", async () => {
      const estamentos = ["MEDICO", "PROFESIONAL", "TECNICO", "ADMINISTRATIVO", "AUXILIAR"] as const;

      for (const est of estamentos) {
        const pos = new Position({
          name: `Cargo ${est}`,
          position_code: `CODE_${est}`,
          estamento: est,
        });
        await pos.save();

        const fetched = await Position.findById(pos._id);
        expect((fetched as any).estamento).toBe(est);
      }
    });

    it("debería rechazar un estamento no permitido por el enum", async () => {
      const position = new Position({
        name: "Directivo General",
        position_code: "DIR_GEN",
        estamento: "DIRECTIVO_INVENTADO",
      });

      await expect(position.save()).rejects.toThrow();
    });

    it("debería incluir 'estamento' dentro de la constante POSITION_AUDIT_FIELDS", () => {
      expect(POSITION_AUDIT_FIELDS).toContain("estamento");
    });
  });

  describe("Esquema Zod (position.schema)", () => {
    it("debería asignar estamento 'PROFESIONAL' por defecto al validar createPositionSchema", () => {
      const payload = {
        body: {
          name: "Kinesiólogo",
          position_code: "KIN_01",
        },
      };

      const parsed = createPositionSchema.parse(payload);
      expect((parsed.body as any).estamento).toBe("PROFESIONAL");
    });

    it("debería aceptar un estamento válido explícito en createPositionSchema", () => {
      const payload = {
        body: {
          name: "Médico Especialista",
          position_code: "MED_ESP",
          estamento: "MEDICO",
        },
      };

      const parsed = createPositionSchema.parse(payload);
      expect((parsed.body as any).estamento).toBe("MEDICO");
    });

    it("debería fallar la validación Zod si se envía un estamento inválido", () => {
      const payload = {
        body: {
          name: "Cargo Inválido",
          position_code: "INV_01",
          estamento: "INVALIDO",
        },
      };

      expect(() => createPositionSchema.parse(payload)).toThrow();
    });
  });
});

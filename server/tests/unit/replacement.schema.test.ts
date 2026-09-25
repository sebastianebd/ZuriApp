import { describe, it, expect } from "vitest";
import {
  createReplacementSchema,
  updateReplacementSchema,
} from "../../schemas/replacement.schema";

describe("Replacement Schema - Causal de Ausencia (TDD RED)", () => {
  const baseValidBody = {
    id_saliente: "507f1f77bcf86cd799439011",
    rut_saliente: "12345678-9",
    nombre_saliente: "Juan",
    apellido_saliente: "Pérez",
    id_entrante: "507f1f77bcf86cd799439022",
    rut_entrante: "98765432-1",
    nombre_entrante: "María",
    apellido_entrante: "González",
    tipo_turno: "4TO_TURNO",
    fecha_inicio: "2026-09-01T08:00:00.000Z",
    fecha_termino: "2026-09-15T20:00:00.000Z",
    servicio: "UCI",
    creado_por: "507f1f77bcf86cd799439033",
  };

  describe("createReplacementSchema", () => {
    it("debería rechazar si 'motivo' no está presente", () => {
      const payload = {
        body: {
          ...baseValidBody,
        },
      };

      const result = createReplacementSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes("motivo"));
        expect(issue).toBeDefined();
      }
    });

    it("debería aceptar cada una de las 8 causales oficiales válidas", () => {
      const causales = [
        "LICENCIA_MEDICA",
        "PRE_POST_NATAL",
        "PERMISO_ADMINISTRATIVO",
        "FERIADO_LEGAL",
        "DIA_COMPENSATORIO",
        "COMISION_SERVICIO",
        "PERMISO_GREMIAL",
        "OTRO",
      ];

      for (const motivo of causales) {
        const payload = {
          body: {
            ...baseValidBody,
            motivo,
            observaciones: motivo === "OTRO" ? "Justificación detallada requerida" : undefined,
          },
        };

        const result = createReplacementSchema.safeParse(payload);
        expect(result.success).toBe(true);
      }
    });

    it("debería rechazar si motivo es 'OTRO' pero observaciones está ausente o vacío", () => {
      const payloadSinObs = {
        body: {
          ...baseValidBody,
          motivo: "OTRO",
        },
      };

      const resultSinObs = createReplacementSchema.safeParse(payloadSinObs);
      expect(resultSinObs.success).toBe(false);

      const payloadVacio = {
        body: {
          ...baseValidBody,
          motivo: "OTRO",
          observaciones: "    ",
        },
      };

      const resultVacio = createReplacementSchema.safeParse(payloadVacio);
      expect(resultVacio.success).toBe(false);
    });

    it("debería rechazar si observaciones excede los 500 caracteres", () => {
      const payloadLargo = {
        body: {
          ...baseValidBody,
          motivo: "LICENCIA_MEDICA",
          observaciones: "a".repeat(501),
        },
      };

      const result = createReplacementSchema.safeParse(payloadLargo);
      expect(result.success).toBe(false);
    });

    it("debería rechazar un motivo no oficial como 'SIN_GOCE_DE_SUELDO' o 'CONTINGENCIA'", () => {
      const payloadInvalido = {
        body: {
          ...baseValidBody,
          motivo: "SIN_GOCE_DE_SUELDO",
        },
      };

      const result = createReplacementSchema.safeParse(payloadInvalido);
      expect(result.success).toBe(false);
    });
  });

  describe("updateReplacementSchema", () => {
    it("debería permitir actualizar motivo u observaciones opcionalmente", () => {
      const payload = {
        params: { id: "507f1f77bcf86cd799439011" },
        body: {
          motivo: "FERIADO_LEGAL",
          observaciones: "Vacaciones autorizadas",
        },
      };

      const result = updateReplacementSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });
});

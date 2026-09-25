import { describe, it, expect } from "vitest";
import {
  getLegalFramework,
  LegalFramework,
  Estamento,
  ContractType,
} from "../../utils/legal-framework.util";

describe("Legal Framework Util - getLegalFramework (TDD RED)", () => {
  describe("Regla 1: Médicos de Planta o Contrata (Ley N° 19.664 / 15.076)", () => {
    it("debería retornar 'LEY_19664' para un funcionario de PLANTA con estamento MEDICO", () => {
      const framework = getLegalFramework("PLANTA", "MEDICO");
      expect(framework).toBe("LEY_19664");
    });

    it("debería retornar 'LEY_19664' para un funcionario de CONTRATA con estamento MEDICO", () => {
      const framework = getLegalFramework("CONTRATA", "MEDICO");
      expect(framework).toBe("LEY_19664");
    });
  });

  describe("Regla 2: Precedencia de Personal a Honorarios (Código del Trabajo)", () => {
    it("debería retornar 'CODIGO_TRABAJO' para un MEDICO a HONORARIOS", () => {
      const framework = getLegalFramework("HONORARIO", "MEDICO");
      expect(framework).toBe("CODIGO_TRABAJO");
    });

    it("debería retornar 'CODIGO_TRABAJO' para un PROFESIONAL a HONORARIOS", () => {
      const framework = getLegalFramework("HONORARIO", "PROFESIONAL");
      expect(framework).toBe("CODIGO_TRABAJO");
    });

    it("debería retornar 'CODIGO_TRABAJO' para un TECNICO a HONORARIOS", () => {
      const framework = getLegalFramework("HONORARIO", "TECNICO");
      expect(framework).toBe("CODIGO_TRABAJO");
    });

    it("debería retornar 'CODIGO_TRABAJO' para un ADMINISTRATIVO o AUXILIAR a HONORARIOS", () => {
      expect(getLegalFramework("HONORARIO", "ADMINISTRATIVO")).toBe("CODIGO_TRABAJO");
      expect(getLegalFramework("HONORARIO", "AUXILIAR")).toBe("CODIGO_TRABAJO");
    });
  });

  describe("Regla 3: Estamentos No Médicos en Planta o Contrata (Ley N° 18.834)", () => {
    it("debería retornar 'LEY_18834' para un PROFESIONAL en PLANTA", () => {
      expect(getLegalFramework("PLANTA", "PROFESIONAL")).toBe("LEY_18834");
    });

    it("debería retornar 'LEY_18834' para un PROFESIONAL en CONTRATA", () => {
      expect(getLegalFramework("CONTRATA", "PROFESIONAL")).toBe("LEY_18834");
    });

    it("debería retornar 'LEY_18834' para un TECNICO en CONTRATA o PLANTA", () => {
      expect(getLegalFramework("CONTRATA", "TECNICO")).toBe("LEY_18834");
      expect(getLegalFramework("PLANTA", "TECNICO")).toBe("LEY_18834");
    });

    it("debería retornar 'LEY_18834' para un ADMINISTRATIVO en PLANTA", () => {
      expect(getLegalFramework("PLANTA", "ADMINISTRATIVO")).toBe("LEY_18834");
    });

    it("debería retornar 'LEY_18834' para un AUXILIAR en CONTRATA", () => {
      expect(getLegalFramework("CONTRATA", "AUXILIAR")).toBe("LEY_18834");
    });
  });
});

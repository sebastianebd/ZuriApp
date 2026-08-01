import { describe, it, expect, vi } from "vitest";
import { generateIndividualExcelReport, generateServiceExcelReport } from "../../services/excel-report.service";

// TDD: Este test verificará que el nuevo servicio de excel-report está estructurado correctamente 
// y expone las funciones esperadas tras la separación del megaservicio.
describe("Excel Report Service", () => {
  it("debería exportar la función generateIndividualExcelReport", () => {
    expect(typeof generateIndividualExcelReport).toBe("function");
  });

  it("debería exportar la función generateServiceExcelReport", () => {
    expect(typeof generateServiceExcelReport).toBe("function");
  });
});

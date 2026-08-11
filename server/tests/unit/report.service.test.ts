import { describe, it, expect } from "vitest";
import { calculateDayNightMetrics } from "../../services/report.service";

describe("Report Service - Unit Tests (Payroll Engine)", () => {
  describe("calculateDayNightMetrics", () => {
    it("debería retornar 0 si no hay entry o exit", () => {
      const result = calculateDayNightMetrics();
      expect(result).toEqual({ totalHours: 0, dayHours: 0, nightHours: 0 });
    });

    it("debería calcular correctamente un turno diurno estándar (08:00 - 17:00)", () => {
      const result = calculateDayNightMetrics("08:00", "17:00");
      expect(result).toEqual({ totalHours: 9, dayHours: 9, nightHours: 0 });
    });

    it("debería calcular correctamente un turno nocturno estándar (20:00 - 08:00)", () => {
      const result = calculateDayNightMetrics("20:00", "08:00");
      expect(result).toEqual({ totalHours: 12, dayHours: 0, nightHours: 12 });
    });

    it("debería calcular correctamente un turno mixto que cruza de día a noche (15:00 - 23:00)", () => {
      const result = calculateDayNightMetrics("15:00", "23:00");
      // Day: 15:00 - 20:00 = 5h
      // Night: 20:00 - 23:00 = 3h
      expect(result).toEqual({ totalHours: 8, dayHours: 5, nightHours: 3 });
    });

    it("debería calcular correctamente un turno mixto que cruza medianoche (22:00 - 06:00)", () => {
      const result = calculateDayNightMetrics("22:00", "06:00");
      // Day: 0 (22-06 is purely night, 20:00 to 08:00 is night)
      expect(result).toEqual({ totalHours: 8, dayHours: 0, nightHours: 8 });
    });
    
    it("debería calcular un turno largo 24 horas (08:00 - 08:00)", () => {
      const result = calculateDayNightMetrics("08:00", "08:00");
      // 08:00 a 08:00 son 24 horas
      expect(result).toEqual({ totalHours: 24, dayHours: 12, nightHours: 12 });
    });
  });
});

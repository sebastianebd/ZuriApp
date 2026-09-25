import { describe, it, expect, vi, beforeEach } from "vitest";
import dashboardService from "../../services/dashboard.service";
import * as redisConfig from "../../config/redis.config";
import socketService from "../../services/socket.service";
import { TurnAssignmentModel } from "../../models/turn-assignment.model";
import Replacement from "../../models/replacement.model";
import Service from "../../models/service.model";
import { TurnSigla } from "../../models/turn-sigla.model";

vi.mock("../../config/redis.config", () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  delPattern: vi.fn(),
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    scanStream: vi.fn(),
  },
}));

vi.mock("../../services/socket.service", () => ({
  default: {
    emitDashboardInvalidated: vi.fn(),
    emitTurnUpdate: vi.fn(),
    emitHistoryUpdate: vi.fn(),
  },
}));

vi.mock("../../models/turn-assignment.model", () => ({
  TurnAssignmentModel: {
    find: vi.fn(),
  },
}));

vi.mock("../../models/replacement.model", () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock("../../models/service.model", () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock("../../models/turn-sigla.model", () => ({
  TurnSigla: {
    find: vi.fn(),
  },
}));

vi.mock("../../models/shift-exception.model", () => ({
  ShiftExceptionModel: {
    find: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
  },
}));

describe("Dashboard Service - Unit Tests (TDD RED)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateReplacementMetrics", () => {
    it("debería calcular correctamente la tasa de reemplazos con datos conocidos", () => {
      // 15 jornadas reemplazadas de 300 programadas = 5.0%
      const scheduledShiftDays = 300;
      const totalShiftsReplaced = 15;
      const rate = dashboardService.calculateReplacementRate(
        totalShiftsReplaced,
        scheduledShiftDays,
      );
      expect(rate).toBe(5);
    });

    it("debería retornar 0 cuando scheduledShiftDays es 0 (evitar división por cero)", () => {
      const rate = dashboardService.calculateReplacementRate(10, 0);
      expect(rate).toBe(0);
    });

    it("debería redondear la tasa a 2 decimales", () => {
      // 10 / 300 = 3.3333... -> 3.33
      const rate = dashboardService.calculateReplacementRate(10, 300);
      expect(rate).toBe(3.33);
    });
  });

  describe("calculateCoverageMetrics", () => {
    it("debería retornar configured: false, overallPercentage: null y status: optimal si dotacion_minima no está configurada", () => {
      const serviceWithoutStaffing: any = {
        _id: "service-1",
        dotacion_minima: [],
        umbrales_cobertura: { verde: 95, amarillo: 85 },
      };

      const result = dashboardService.calculateCoverageMetrics(
        serviceWithoutStaffing,
        new Map(),
        31,
      );

      expect(result.configured).toBe(false);
      expect(result.overallPercentage).toBeNull();
      expect(result.status).toBe("optimal");
      expect(result.uncoveredSlotsCount).toBe(0);
      expect(result.byPosition).toEqual([]);
    });

    it("debería asignar semáforo 'warning' si cobertura es 90% con umbrales por defecto (95/85)", () => {
      const status = dashboardService.evaluateCoverageStatus(90, {
        verde: 95,
        amarillo: 85,
      });
      expect(status).toBe("warning");
    });

    it("debería asignar semáforo 'critical' si cobertura es 80% con umbrales por defecto (95/85)", () => {
      const status = dashboardService.evaluateCoverageStatus(80, {
        verde: 95,
        amarillo: 85,
      });
      expect(status).toBe("critical");
    });

    it("debería asignar semáforo 'optimal' si cobertura es 90% con umbrales personalizados más tolerantes (88/80)", () => {
      const status = dashboardService.evaluateCoverageStatus(90, {
        verde: 88,
        amarillo: 80,
      });
      expect(status).toBe("optimal");
    });
  });

  describe("calculateComparativeDeltas", () => {
    it("debería calcular correctamente deltas porcentuales y puntos porcentuales entre meses", () => {
      const current = {
        totalReplacements: 12,
        replacementRate: 6.0,
        coveragePercentage: 92.5,
      };
      const previous = {
        totalReplacements: 10,
        replacementRate: 5.0,
        coveragePercentage: 95.0,
      };

      const comparative = dashboardService.calculateComparativeDeltas(
        current,
        previous,
      );

      // (12 - 10) / 10 * 100 = 20%
      expect(comparative.replacementsDeltaPct).toBe(20);
      // 6.0 - 5.0 = 1.0 punto
      expect(comparative.replacementRateDeltaPoints).toBe(1);
      // 92.5 - 95.0 = -2.5 puntos
      expect(comparative.coverageDeltaPoints).toBe(-2.5);
    });

    it("debería retornar null para replacementsDeltaPct si el mes anterior tuvo 0 reemplazos", () => {
      const current = {
        totalReplacements: 5,
        replacementRate: 2.0,
        coveragePercentage: 90,
      };
      const previous = {
        totalReplacements: 0,
        replacementRate: 0,
        coveragePercentage: 90,
      };

      const comparative = dashboardService.calculateComparativeDeltas(
        current,
        previous,
      );
      expect(comparative.replacementsDeltaPct).toBeNull();
    });
  });

  describe("Redis Caching and Invalidation", () => {
    it("debería retornar datos en caché con cached: true si existe en Redis", async () => {
      const cachedData = {
        period: { month: 10, year: 2026 },
        summary: { totalReplacements: 5 },
      };
      (redisConfig.get as any).mockResolvedValue(cachedData);

      const result = await dashboardService.getServiceKPIs(
        "service-123",
        10,
        2026,
      );

      expect(redisConfig.get).toHaveBeenCalledWith(
        "kpi:service:service-123:2026:10",
      );
      expect(result.cached).toBe(true);
      expect(result.summary.totalReplacements).toBe(5);
    });

    it("debería invalidar la clave de Redis y emitir Socket.io al invalidar caché del servicio", async () => {
      await dashboardService.invalidateDashboardCache("service-123");

      expect(redisConfig.delPattern).toHaveBeenCalledWith(
        "kpi:service:service-123:*",
      );
      expect(socketService.emitDashboardInvalidated).toHaveBeenCalledWith(
        "service-123",
      );
    });
  });
});

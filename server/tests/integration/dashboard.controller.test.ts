import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app";
import Service from "../../models/service.model";
import * as redisConfig from "../../config/redis.config";
import dashboardService from "../../services/dashboard.service";

// Mock del middleware de autenticación
let currentAuthUser: any = {
  _id: "staff-supervisor-1",
  firstName: "Supervisor",
  lastName: "Servicio",
  roleId: { level: 10, permissions: ["shifts.view"] },
};

vi.mock("../../middleware/authentication.middleware", () => ({
  default: (req: any, res: any, next: any) => {
    if (!currentAuthUser) {
      return res.status(401).json({ success: false, message: "Token no provisto" });
    }
    req.staff = currentAuthUser;
    req.account = { id: "acc-1", staffId: currentAuthUser._id, name: "Supervisor Test" };
    next();
  },
  requirePermission: (permission: string) => (req: any, res: any, next: any) => {
    if (!currentAuthUser) {
      return res.status(401).json({ success: false, message: "No autenticado" });
    }
    if (
      currentAuthUser.roleId?.level === 100 ||
      currentAuthUser.roleId?.permissions?.includes(permission)
    ) {
      return next();
    }
    return res.status(403).json({ success: false, message: "Permiso denegado" });
  },
  requireAdmin: (req: any, res: any, next: any) => {
    if (currentAuthUser?.roleId?.level === 100) return next();
    return res.status(403).json({ success: false, message: "Admin requerido" });
  },
}));

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

vi.mock("../../services/dashboard.service", () => ({
  default: {
    getServiceKPIs: vi.fn(),
    invalidateDashboardCache: vi.fn(),
    calculateReplacementRate: vi.fn(),
    calculateCoverageMetrics: vi.fn(),
    evaluateCoverageStatus: vi.fn(),
    calculateComparativeDeltas: vi.fn(),
  },
}));

vi.mock("../../models/service.model", () => {
  return {
    default: {
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      find: vi.fn(),
    },
  };
});

describe("Dashboard & Staffing Endpoints - Integration Tests (TDD RED)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentAuthUser = {
      _id: "staff-supervisor-1",
      firstName: "Supervisor",
      lastName: "Servicio",
      roleId: { level: 10, permissions: ["shifts.view"] },
    };
  });

  describe("GET /api/dashboard/:serviceId/kpis", () => {
    it("debería responder 200 OK con los KPIs calculados del servicio", async () => {
      const mockKPIs = {
        period: { month: 10, year: 2026 },
        service: { id: "srv-uci", name: "UCI Adultos", canEditStaffing: true },
        summary: {
          totalReplacements: 14,
          replacementRate: 4.8,
          scheduledShiftDays: 290,
          totalShiftsReplaced: 14,
        },
        coverage: {
          configured: true,
          overallPercentage: 96.5,
          status: "optimal",
          thresholds: { green: 95, yellow: 85 },
          uncoveredSlotsCount: 2,
          byPosition: [],
        },
        hoursBreakdown: {
          totalHours: 168,
          dayHours: 84,
          nightHours: 84,
          nightPercentage: 50,
        },
        topReplacedStaff: [],
        comparative: {
          previousPeriod: { month: 9, year: 2026 },
          replacementsDeltaPct: -5,
          replacementRateDeltaPoints: -0.2,
          coverageDeltaPoints: 1.5,
        },
        cached: false,
        generatedAt: new Date().toISOString(),
      };

      (dashboardService.getServiceKPIs as any).mockResolvedValue(mockKPIs);

      const res = await request(app).get("/api/dashboard/srv-uci/kpis?month=10&year=2026");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.replacementRate).toBe(4.8);
      expect(res.body.data.coverage.status).toBe("optimal");
      expect(dashboardService.getServiceKPIs).toHaveBeenCalledWith(
        "srv-uci",
        10,
        2026,
        "staff-supervisor-1",
        expect.any(Object),
        false,
      );
    });

    it("debería pasar bypassCache=true a getServiceKPIs cuando req.query.refresh === 'true'", async () => {
      (dashboardService.getServiceKPIs as any).mockResolvedValue({
        summary: { replacementRate: 5 },
        coverage: { status: "optimal" },
      });

      const res = await request(app).get("/api/dashboard/srv-uci/kpis?month=10&year=2026&refresh=true");

      expect(res.status).toBe(200);
      expect(dashboardService.getServiceKPIs).toHaveBeenCalledWith(
        "srv-uci",
        10,
        2026,
        "staff-supervisor-1",
        expect.any(Object),
        true,
      );
    });

    it("debería responder 403 si el usuario carece del permiso shifts.view", async () => {
      currentAuthUser = {
        _id: "staff-no-perm",
        roleId: { level: 1, permissions: [] },
      };

      const res = await request(app).get("/api/dashboard/srv-uci/kpis");

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/services/:id/staffing - Contextual RBAC", () => {
    it("debería responder 200 OK y actualizar la dotación cuando el usuario es supervisor del servicio", async () => {
      const mockService: any = {
        _id: "srv-1",
        nombre: "Medicina",
        supervisor: "staff-supervisor-1",
        coordinadores: [],
        dotacion_minima: [],
        umbrales_cobertura: { verde: 95, amarillo: 85 },
        save: vi.fn().mockResolvedValue(true),
      };

      (Service.findById as any).mockResolvedValue(mockService);

      const payload = {
        dotacion_minima: [
          { positionId: "pos-enf", minimo_dia: 4, minimo_noche: 2 },
        ],
        umbrales_cobertura: { verde: 92, amarillo: 82 },
      };

      const res = await request(app)
        .patch("/api/services/srv-1/staffing")
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockService.dotacion_minima).toEqual(payload.dotacion_minima);
      expect(mockService.umbrales_cobertura).toEqual(payload.umbrales_cobertura);
      expect(dashboardService.invalidateDashboardCache).toHaveBeenCalledWith("srv-1");
    });

    it("debería responder 200 OK cuando el usuario es coordinador del servicio", async () => {
      currentAuthUser = {
        _id: "staff-coord-1",
        roleId: { level: 10, permissions: [] },
      };

      const mockService: any = {
        _id: "srv-1",
        nombre: "Medicina",
        supervisor: "other-supervisor",
        coordinadores: ["staff-coord-1"],
        dotacion_minima: [],
        umbrales_cobertura: { verde: 95, amarillo: 85 },
        save: vi.fn().mockResolvedValue(true),
      };

      (Service.findById as any).mockResolvedValue(mockService);

      const res = await request(app)
        .patch("/api/services/srv-1/staffing")
        .send({
          dotacion_minima: [
            { positionId: "pos-tens", minimo_dia: 3, minimo_noche: 2 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("debería responder 403 Forbidden cuando el usuario es funcionario ordinario ajeno a la jefatura/coordinación del servicio", async () => {
      currentAuthUser = {
        _id: "staff-otro-servicio",
        roleId: { level: 10, permissions: [] }, // No es admin ni tiene service.update
      };

      const mockService: any = {
        _id: "srv-1",
        nombre: "Medicina",
        supervisor: "supervisor-1",
        coordinadores: ["coord-1"],
      };

      (Service.findById as any).mockResolvedValue(mockService);

      const res = await request(app)
        .patch("/api/services/srv-1/staffing")
        .send({
          umbrales_cobertura: { verde: 90, amarillo: 80 },
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/permisos|autorizado/i);
    });

    it("debería responder 200 OK cuando el usuario es SYS_ADMIN (level 100) aunque no pertenezca al servicio", async () => {
      currentAuthUser = {
        _id: "admin-global",
        roleId: { level: 100, permissions: ["*"] },
      };

      const mockService: any = {
        _id: "srv-1",
        nombre: "Medicina",
        supervisor: "supervisor-1",
        coordinadores: [],
        dotacion_minima: [],
        umbrales_cobertura: { verde: 95, amarillo: 85 },
        save: vi.fn().mockResolvedValue(true),
      };

      (Service.findById as any).mockResolvedValue(mockService);

      const res = await request(app)
        .patch("/api/services/srv-1/staffing")
        .send({
          umbrales_cobertura: { verde: 90, amarillo: 80 },
        });

      expect(res.status).toBe(200);
    });
  });
});

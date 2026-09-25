export interface DashboardKPIResponse {
  success: boolean;
  data: {
    period: { month: number; year: number };
    service: {
      id: string;
      name: string;
      canEditStaffing: boolean;
    };
    summary: {
      totalReplacements: number;
      replacementRate: number;
      scheduledShiftDays: number;
      totalShiftsReplaced: number;
    };
    coverage: {
      configured: boolean;
      overallPercentage: number | null;
      status: "optimal" | "warning" | "critical";
      thresholds: {
        green: number;
        yellow: number;
      };
      uncoveredSlotsCount: number;
      byPosition: Array<{
        positionId: string;
        positionName: string;
        minDay: number;
        minNight: number;
        coveragePercentage: number;
      }>;
    };
    hoursBreakdown: {
      totalHours: number;
      dayHours: number;
      nightHours: number;
      nightPercentage: number;
    };
    topReplacedStaff: Array<{
      staffId: string;
      fullName: string;
      rut: string;
      positionName: string;
      replacementCount: number;
      totalShiftsReplaced: number;
    }>;
    comparative: {
      previousPeriod: { month: number; year: number };
      replacementsDeltaPct: number | null;
      replacementRateDeltaPoints: number | null;
      coverageDeltaPoints: number | null;
    };
    cached: boolean;
    generatedAt: string;
  };
}

export interface UpdateServiceStaffingPayload {
  dotacion_minima?: Array<{
    positionId: string;
    minimo_dia: number;
    minimo_noche: number;
  }>;
  umbrales_cobertura?: {
    verde: number;
    amarillo: number;
  };
}

export interface PortalHomeSummaryDTO {
  nextShift: {
    id: string;
    assignmentModel: 'TurnAssignment' | 'Replacement';
    date: string;              // YYYY-MM-DD
    sigla: string;             // 'L', 'N', etc.
    entryTime: string;         // '08:00'
    exitTime: string;          // '20:00'
    serviceName: string;
    serviceLocation?: string;
    confirmationStatus?: 'confirmed' | 'unavailable';
    canConfirm: boolean;       // true si está dentro de los próximos 7 días
  } | null;
  kpis: {
    shiftsCompleted: number;
    shiftsRemaining: number;
    replacementsCount: number;
    dayHours: number;
    nightHours: number;
    totalHours: number;
  };
  weeklyAgenda: Array<{
    date: string;
    dayName: string;
    sigla: string;
    isWorkDay: boolean;
    isReplacement: boolean;
    shiftName: string;
    serviceName: string;
  }>;
}

export interface PortalShiftItemDTO {
  date: string;                // YYYY-MM-DD
  sigla: string;
  isWorkDay: boolean;
  isReplacement: boolean;
  replacementId?: string;
  replacementBusinessCode?: string; // ej: 'REP-2026-0891'
  serviceId: string;
  serviceName: string;
  entryTime?: string;
  exitTime?: string;
  confirmationStatus?: 'confirmed' | 'unavailable';
}

export interface PortalReplacementContractDTO {
  id: string;
  businessCode: string;        // ej: 'REP-2026-0891'
  serviceId: string;
  serviceName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'Activo' | 'Finalizado' | 'Corte Anticipado';
  shiftsCommittedCount: number;
  origin: 'Asignación Directa' | 'Bolsa de Reemplazos';
}

export interface PortalShiftsResponseDTO {
  period: { month: number; year: number };
  isClosed: boolean;
  shifts: PortalShiftItemDTO[];
  replacementContracts: PortalReplacementContractDTO[];
}

export interface ConfirmShiftDTO {
  assignmentModel: 'TurnAssignment' | 'Replacement';
  date: string;
}

export interface ReportUnavailableDTO {
  assignmentModel: 'TurnAssignment' | 'Replacement';
  date: string;
  reason: string;
}

export interface UpdatePreferencesDTO {
  shiftReminders?: boolean;
  shiftChanges?: boolean;
  openCallsEnabled?: boolean;
  preferredServices?: string[];
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

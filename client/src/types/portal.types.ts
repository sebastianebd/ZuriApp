export interface PwaUserProfile {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  contractType: 'PLANTA' | 'CONTRATA' | 'HONORARIO';
  positionName: string;
  estamento: string;
  notificationPreferences?: {
    shiftReminders: boolean;
    shiftChanges: boolean;
    openCallsEnabled: boolean;
    preferredServices: string[];
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
}

export interface PortalHomeData {
  nextShift: {
    id: string;
    assignmentModel: 'TurnAssignment' | 'Replacement';
    date: string;
    sigla: string;
    entryTime: string;
    exitTime: string;
    serviceName: string;
    serviceLocation?: string;
    confirmationStatus?: 'confirmed' | 'unavailable';
    canConfirm: boolean;
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

export interface UserPreferencesDTO {
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

export interface PortalShiftItem {
  date: string; // YYYY-MM-DD
  sigla: string; // 'L', 'N', 'X', etc.
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

export interface PortalReplacementContract {
  id: string;
  businessCode: string; // ej: 'REP-2026-0891'
  serviceId: string;
  serviceName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'Activo' | 'Finalizado' | 'Corte Anticipado';
  shiftsCommittedCount: number;
  origin: 'Asignación Directa' | 'Bolsa de Reemplazos';
}

export interface PortalShiftsViewData {
  period: { month: number; year: number };
  isClosed: boolean;
  shifts: PortalShiftItem[];
  replacementContracts: PortalReplacementContract[];
}

export interface PwaOpenOfferItem {
  id: string;
  serviceId?: string;
  serviceName: string;
  serviceLocation?: string;
  positionId?: string;
  positionName: string;
  tipo_turno: string;
  entryTime?: string;
  exitTime?: string;
  fecha_inicio: string;
  fecha_termino: string;
  totalShifts?: number;
  expiresAt: string;
  observaciones?: string;
  applicantsCount?: number;
  alreadyApplied?: boolean;
  hasApplied?: boolean;
  myApplicationStatus?: 'pending' | 'selected' | 'not_selected' | 'cancelled_by_staff' | 'withdrawn_conflict';
  createdAt?: string;
}

export interface PwaMyApplicationItem {
  offerId: string;
  serviceName: string;
  positionName: string;
  tipo_turno: string;
  fecha_inicio: string;
  fecha_termino: string;
  appliedAt: string;
  offerStatus?: 'open' | 'evaluating' | 'awarded' | 'cancelled' | 'expired';
  myStatus?: 'pending' | 'selected' | 'not_selected' | 'cancelled_by_staff' | 'withdrawn_conflict';
  status: 'pending' | 'selected' | 'not_selected' | 'cancelled_by_staff' | 'withdrawn_conflict';
  statusLabel?: string;
  statusColor?: string;
}

export interface PortalNotification {
  id: string;
  type: 'schedule_published' | 'replacement_assigned' | 'offer_published' | 'announcement';
  title: string;
  message: string;
  date: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  serviceName?: string;
}


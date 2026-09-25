export interface ReplacementOfferItem {
  id: string;
  serviceId: string;
  serviceName: string;
  positionId: string;
  positionName: string;
  status: 'open' | 'finalized' | 'filled' | 'cancelled';
  expiresAt: string;
  fecha_inicio: string;
  fecha_termino: string;
  tipo_turno: string;
  applicantsCount: number;
  id_saliente?: string;
  nombre_saliente?: string;
  rut_saliente?: string;
  motivo?: string;
  observaciones?: string;
}

export interface CandidateBreakdown {
  previousReplacements: number;
  accumulatedHoursMonthly: number;
  hoursSinceLastShift: number;
  matchesPosition: boolean;
  cleanRecord: boolean;
  nearWeeklyCapPenalty: boolean;
  nightShiftAdjacencyPenalty: boolean;
}

export interface ScoredCandidateItem {
  staffId: string;
  fullName: string;
  rut: string;
  phone: string;
  positionName: string;
  score: number;
  breakdown: CandidateBreakdown;
}

export interface OfferScoringData {
  offerId: string;
  isCallList: boolean;
  candidates: ScoredCandidateItem[];
}

import { AusenciaSalienteMotivo } from '../models/replacement.model';

export interface CreateReplacementOfferDTO {
  serviceId: string;
  positionId: string;
  id_saliente: string;
  motivo: AusenciaSalienteMotivo;
  observaciones?: string;
  tipo_turno: string;
  turn_type_id?: string;
  fecha_inicio: string; // ISO
  fecha_termino: string; // ISO
  expiresAt: string; // ISO
}

export interface ReplacementOfferListItemDTO {
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
  awardedStaffId?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface AwardOfferDTO {
  targetStaffId: string;
}

export interface ApplyOfferDTO {
  // Opcional: notas o disponibilidad
  notes?: string;
}

export interface CandidateScoreBreakdown {
  matchesPosition: boolean;            // +30 pts (cargo exacto)
  hoursSinceLastShift: number;         // +20 pts (descanso post-turno >= 24h)
  historicalHoursInService: number;    // +1 pt por cada 12 hrs trabajadas (fidelidad)
}

export interface ScoredCandidateDTO {
  staffId: string;
  fullName: string;
  rut: string;
  phone: string;
  positionName: string;
  score: number;
  breakdown: CandidateScoreBreakdown;
  isValid?: boolean;
  violations?: string[];
}

export interface OfferScoringResponseDTO {
  success: boolean;
  data: {
    offerId: string;
    isCallList: boolean; // true si es lista de búsqueda activa (con 0 postulantes)
    candidates: ScoredCandidateDTO[];
  };
}

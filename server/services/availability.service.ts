import mongoose from 'mongoose';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import ReplacementOffer from '../models/replacement-offer.model';
import Replacement from '../models/replacement.model';
import Staff from '../models/staff.model';
import ShiftConfirmation from '../models/shift-confirmation.model';
import TurnAssignment from '../models/turn-assignment.model';
import {
  CandidateScoreBreakdown,
  ScoredCandidateDTO,
} from '../types/replacement-offer.types';

dayjs.extend(isoWeek);

interface ShiftWindow {
  start: Date;
  end: Date;
  isNight?: boolean;
  hours?: number;
}

export class AvailabilityService {
  /**
   * Pre-valida en memoria si un candidato cumple todas las restricciones normativas
   * (colisión de horarios, descanso insuficiente < 12h NORM-01, doble turno continuo NORM-02).
   */
  static async validateCompliance(
    staffId: string,
    dateStart: Date,
    dateEnd: Date,
    _shiftType: string
  ): Promise<{ valid: boolean; violations: string[] }> {
    const violations: string[] = [];

    const offerStart = dayjs(dateStart);
    const offerEnd = dayjs(dateEnd);

    // Buscar turnos de reemplazo activos del funcionario en una ventana de +/- 48h
    const windowStart = offerStart.subtract(2, 'day').toDate();
    const windowEnd = offerEnd.add(2, 'day').toDate();

    const [replacements, assignments] = await Promise.all([
      Replacement.find({
        id_entrante: staffId,
        status: { $ne: 'anulado' },
        fecha_inicio: { $lte: windowEnd },
        fecha_termino: { $gte: windowStart },
      }),
      TurnAssignment.find({
        staffId,
        date: { $gte: windowStart, $lte: windowEnd },
      }),
    ]);

    const existingWindows: ShiftWindow[] = [];

    replacements.forEach((r: any) => {
      existingWindows.push({
        start: new Date(r.fecha_inicio),
        end: new Date(r.fecha_termino),
      });
    });

    assignments.forEach((a: any) => {
      if (a.date) {
        // Turno por defecto de 12 horas si no hay detalles de horario
        const st = dayjs(a.date).hour(8).minute(0).toDate();
        const et = dayjs(a.date).hour(20).minute(0).toDate();
        existingWindows.push({ start: st, end: et });
      }
    });

    for (const ex of existingWindows) {
      const exStart = dayjs(ex.start);
      const exEnd = dayjs(ex.end);

      // 1. Colisión exacta o superposición: exStart < offerEnd && exEnd > offerStart
      const isOverlap = exStart.isBefore(offerEnd) && exEnd.isAfter(offerStart);
      if (isOverlap) {
        if (!violations.includes('COLLISION')) {
          violations.push('COLLISION');
        }
      }

      // 2. Doble turno continuo (NORM-02): gap <= 30 min y jornada continua >= 20 horas
      // Caso A: ex termina y oferta empieza
      const gapBeforeMin = Math.abs(offerStart.diff(exEnd, 'minute'));
      const durationA = offerEnd.diff(exStart, 'minute');
      if (gapBeforeMin <= 30 && durationA >= 20 * 60) {
        if (!violations.includes('NORM-02')) {
          violations.push('NORM-02');
        }
      }

      // Caso B: oferta termina y ex empieza
      const gapAfterMin = Math.abs(exStart.diff(offerEnd, 'minute'));
      const durationB = exEnd.diff(offerStart, 'minute');
      if (gapAfterMin <= 30 && durationB >= 20 * 60) {
        if (!violations.includes('NORM-02')) {
          violations.push('NORM-02');
        }
      }

      // 3. Descanso insuficiente de 12h (NORM-01): gap positivo pero < 720 min
      if (!isOverlap) {
        if (offerStart.isAfter(exEnd) || offerStart.isSame(exEnd)) {
          const restMin = offerStart.diff(exEnd, 'minute');
          if (restMin < 12 * 60) {
            if (!violations.includes('NORM-01')) {
              violations.push('NORM-01');
            }
          }
        } else if (exStart.isAfter(offerEnd) || exStart.isSame(offerEnd)) {
          const restMin = exStart.diff(offerEnd, 'minute');
          if (restMin < 12 * 60) {
            if (!violations.includes('NORM-01')) {
              violations.push('NORM-01');
            }
          }
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Calcula el puntaje en memoria y su desglose detallado para un funcionario específico.
   */
  private static async calculateScoreForStaff(
    staff: any,
    targetServiceId: string,
    targetPositionId: string,
    offerStart: Date,
    offerEnd: Date
  ): Promise<ScoredCandidateDTO> {
    const staffId = staff._id?.toString() || staff.id;
    const startM = dayjs(offerStart);
    const endM = dayjs(offerEnd);

    // 1. Reemplazos previos históricos en el servicio solicitante
    // Buscamos todos los turnos que no estén anulados para este funcionario
    const allReplacements = await Replacement.find({
      id_entrante: staffId,
      status: { $ne: 'anulado' },
    });

    let historicalHoursInService = 0;
    allReplacements.forEach((r: any) => {
      const srvId = r.servicio?.toString() || r.servicio;
      if (srvId === targetServiceId.toString()) {
        const rStart = dayjs(r.fecha_inicio);
        const rEnd = dayjs(r.fecha_termino);
        const h = rEnd.diff(rStart, 'hour', true);
        historicalHoursInService += Math.max(0, h);
      }
    });

    // 2. Horas de descanso desde el último turno (de todos los servicios)
    let hoursSinceLastShift = 999;
    let lastShiftEnd: dayjs.Dayjs | null = null;

    allReplacements.forEach((r: any) => {
      const rEnd = dayjs(r.fecha_termino);
      if (rEnd.isBefore(startM)) {
        if (!lastShiftEnd || rEnd.isAfter(lastShiftEnd)) {
          lastShiftEnd = rEnd;
        }
      }
    });

    if (lastShiftEnd) {
      hoursSinceLastShift = Number(startM.diff(lastShiftEnd, 'hour', true).toFixed(1));
    }

    // 3. Concordancia exacta de cargo
    const staffPosId = staff.positionId?._id?.toString() || staff.positionId?.toString();
    const matchesPosition = staffPosId === targetPositionId.toString();

    // === NUEVO MOTOR DE PUNTUACIÓN SIMPLIFICADO ===
    const pointsPosition = matchesPosition ? 30 : 0;
    const pointsRest = hoursSinceLastShift >= 24 ? 20 : 0;
    // 1 punto por cada 12 horas trabajadas históricamente en el servicio
    const pointsExperience = Math.floor(historicalHoursInService / 12);

    const score = Math.max(0, pointsPosition + pointsRest + pointsExperience);

    const breakdown: any = {
      matchesPosition,
      hoursSinceLastShift,
      historicalHoursInService: Math.round(historicalHoursInService),
    };

    const positionName =
      (staff.positionId as any)?.name ||
      staff.positionName ||
      'Funcionario/a';

    return {
      staffId,
      fullName: `${staff.firstName} ${staff.lastName}`.trim(),
      rut: staff.rut,
      phone: staff.phone || '+56900000000',
      positionName,
      score,
      breakdown,
    };
  }

  /**
   * Evalúa y rankea a los postulantes registrados de una convocatoria específica.
   */
  static async scoreOfferApplicants(offerId: string): Promise<ScoredCandidateDTO[]> {
    const offer = await ReplacementOffer.findById(offerId).populate([
      'serviceId',
      'positionId',
    ]);

    if (!offer) {
      const err: any = new Error('Convocatoria no encontrada');
      err.status = 404;
      throw err;
    }

    if (!offer.applicants || offer.applicants.length === 0) {
      return [];
    }

    const activeApplicantIds = offer.applicants
      .filter((a: any) => a.status === 'pending' || a.status === 'selected')
      .map((a: any) => a.staffId?.toString());

    if (activeApplicantIds.length === 0) {
      return [];
    }

    const staffMembers = await Staff.find({
      _id: { $in: activeApplicantIds },
      isActive: true,
      isDeleted: { $ne: true },
    }).populate('positionId');

    const serviceIdStr =
      (offer.serviceId as any)?._id?.toString() || offer.serviceId?.toString();
    const positionIdStr =
      (offer.positionId as any)?._id?.toString() || offer.positionId?.toString();

    const scoredList: ScoredCandidateDTO[] = [];

    for (const staff of staffMembers) {
      if (!staff.isActive || staff.isDeleted) {
        continue;
      }

      const staffPosId = (staff.positionId as any)?._id?.toString() || staff.positionId?.toString();
      if (staffPosId !== positionIdStr) {
        continue;
      }

      const compliance = await this.validateCompliance(
        staff._id.toString(),
        offer.fecha_inicio,
        offer.fecha_termino,
        offer.tipo_turno
      );

      const candidate = await this.calculateScoreForStaff(
        staff,
        serviceIdStr,
        positionIdStr,
        offer.fecha_inicio,
        offer.fecha_termino
      );

      candidate.isValid = compliance.valid;
      candidate.violations = compliance.violations;

      scoredList.push(candidate);
    }

    return scoredList.sort((a, b) => {
      if (a.isValid !== b.isValid) {
        return a.isValid ? -1 : 1;
      }
      return b.score - a.score;
    });
  }

  /**
   * Búsqueda activa: Identifica y rankea al Top 10 de candidatos elegibles de todo el hospital
   * para un servicio, rango de fechas y cargo específico.
   */
  static async getTopEligibleCandidates(
    serviceId: string,
    positionId: string,
    dateStart: Date,
    dateEnd: Date
  ): Promise<ScoredCandidateDTO[]> {
    const eligibleStaffMembers = await Staff.find({
      positionId,
      contractType: 'HONORARIO',
      isActive: true,
      isDeleted: { $ne: true },
    }).populate('positionId');

    const scoredCandidates: ScoredCandidateDTO[] = [];

    for (const staff of eligibleStaffMembers) {
      const compliance = await this.validateCompliance(
        staff._id.toString(),
        dateStart,
        dateEnd,
        'HONORARIO'
      );

      if (compliance.valid) {
        const candidate = await this.calculateScoreForStaff(
          staff,
          serviceId,
          positionId,
          dateStart,
          dateEnd
        );
        scoredCandidates.push(candidate);
      }
    }

    return scoredCandidates.sort((a, b) => b.score - a.score).slice(0, 10);
  }
}

export default AvailabilityService;

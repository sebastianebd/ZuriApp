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

    // 1. Reemplazos previos en el servicio solicitante
    const allReplacements = await Replacement.find({
      id_entrante: staffId,
      status: 'activo',
    });

    const previousReplacements = allReplacements.filter(
      (r: any) => (r.servicio?.toString() || r.servicio) === targetServiceId.toString()
    ).length;

    // 2. Horas acumuladas en el mes calendario de la oferta
    const monthStart = startM.startOf('month');
    const monthEnd = startM.endOf('month');

    let accumulatedHoursMonthly = 0;
    allReplacements.forEach((r: any) => {
      const rStart = dayjs(r.fecha_inicio);
      const rEnd = dayjs(r.fecha_termino);
      if (rStart.isAfter(monthStart) && rStart.isBefore(monthEnd)) {
        const h = rEnd.diff(rStart, 'hour', true);
        accumulatedHoursMonthly += Math.max(0, h);
      }
    });

    // 3. Horas de descanso desde el último turno
    let hoursSinceLastShift = 999; // Si no tiene turno previo, descanso ideal
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

    // 4. Concordancia exacta de cargo
    const staffPosId = staff.positionId?._id?.toString() || staff.positionId?.toString();
    const matchesPosition = staffPosId === targetPositionId.toString();

    // 5. Historial intachable (ShiftConfirmation unavailable)
    const unavailables = await ShiftConfirmation.find({
      staffId,
      status: 'unavailable',
    });
    const cleanRecord = !unavailables || unavailables.length === 0;

    // 6. Penalización por cercanía al límite semanal de 44h (semana ISO)
    const weekStart = startM.startOf('isoWeek');
    const weekEnd = startM.endOf('isoWeek');
    let weeklyHours = 0;
    allReplacements.forEach((r: any) => {
      const rStart = dayjs(r.fecha_inicio);
      const rEnd = dayjs(r.fecha_termino);
      if (rStart.isAfter(weekStart) && rStart.isBefore(weekEnd)) {
        weeklyHours += Math.max(0, rEnd.diff(rStart, 'hour', true));
      }
    });
    const nearWeeklyCapPenalty = weeklyHours >= 36;

    // 7. Penalización por turno nocturno adyacente (< 24h antes o después)
    let nightShiftAdjacencyPenalty = false;
    allReplacements.forEach((r: any) => {
      const rStart = dayjs(r.fecha_inicio);
      const rEnd = dayjs(r.fecha_termino);
      const isNight = rStart.hour() >= 19 || rEnd.hour() <= 9;
      if (isNight) {
        const gapBefore = Math.abs(startM.diff(rEnd, 'hour'));
        const gapAfter = Math.abs(rStart.diff(endM, 'hour'));
        if (gapBefore <= 24 || gapAfter <= 24) {
          nightShiftAdjacencyPenalty = true;
        }
      }
    });

    // Ponderación de Soft Constraints
    const pointsPrevious = previousReplacements > 0 ? 30 : 0;
    let pointsHours = 0;
    if (accumulatedHoursMonthly <= 44) pointsHours = 25;
    else if (accumulatedHoursMonthly <= 88) pointsHours = 15;
    else if (accumulatedHoursMonthly <= 132) pointsHours = 5;
    else pointsHours = 0;

    const pointsRest = hoursSinceLastShift >= 24 ? 20 : 0;
    const pointsPosition = matchesPosition ? 15 : 0;
    const pointsClean = cleanRecord ? 10 : 0;
    const penaltyWeekly = nearWeeklyCapPenalty ? 20 : 0;
    const penaltyNight = nightShiftAdjacencyPenalty ? 30 : 0;

    const score = Math.max(
      0,
      pointsPrevious +
        pointsHours +
        pointsRest +
        pointsPosition +
        pointsClean -
        penaltyWeekly -
        penaltyNight
    );

    const breakdown: CandidateScoreBreakdown = {
      previousReplacements,
      accumulatedHoursMonthly: Math.round(accumulatedHoursMonthly),
      hoursSinceLastShift,
      matchesPosition,
      cleanRecord,
      nearWeeklyCapPenalty,
      nightShiftAdjacencyPenalty,
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

      if (compliance.valid) {
        const candidate = await this.calculateScoreForStaff(
          staff,
          serviceIdStr,
          positionIdStr,
          offer.fecha_inicio,
          offer.fecha_termino
        );
        scoredList.push(candidate);
      }
    }

    return scoredList.sort((a, b) => b.score - a.score);
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

import mongoose from 'mongoose';
import TurnAssignment from '../models/turn-assignment.model';
import Replacement from '../models/replacement.model';
import ShiftConfirmation from '../models/shift-confirmation.model';
import Alert from '../models/alert.model';
import Staff from '../models/staff.model';
import Period from '../models/period.model';
import socketService from './socket.service';
import {
  PortalHomeSummaryDTO,
  PortalShiftsResponseDTO,
  PortalShiftItemDTO,
  PortalReplacementContractDTO,
  UpdatePreferencesDTO,
} from '../types/portal.types';

export class PwaShiftsService {
  static async getHomeSummary(staffId: string): Promise<PortalHomeSummaryDTO> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    // 1. Obtener los turnos reales del mes actual
    const currentMonthData = await PwaShiftsService.getShifts(
      staffId,
      today.getMonth() + 1,
      today.getFullYear()
    );

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 2. Determinar el Próximo Turno real a partir de hoy
    let upcomingWorkShift = currentMonthData.shifts.find((s) => s.date >= todayStr && s.isWorkDay);
    if (!upcomingWorkShift) {
      const nextMonth = today.getMonth() === 11 ? 1 : today.getMonth() + 2;
      const nextYear = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
      const nextMonthData = await PwaShiftsService.getShifts(staffId, nextMonth, nextYear);
      upcomingWorkShift = nextMonthData.shifts.find((s) => s.isWorkDay);
    }

    let nextShift: PortalHomeSummaryDTO['nextShift'] = null;
    if (upcomingWorkShift) {
      nextShift = {
        id: upcomingWorkShift.replacementId || upcomingWorkShift.serviceId || staffId,
        assignmentModel: upcomingWorkShift.isReplacement ? 'Replacement' : 'TurnAssignment',
        date: upcomingWorkShift.date,
        sigla: upcomingWorkShift.sigla,
        entryTime: upcomingWorkShift.entryTime || (upcomingWorkShift.sigla === 'N' ? '20:00' : '08:00'),
        exitTime: upcomingWorkShift.exitTime || (upcomingWorkShift.sigla === 'N' ? '08:00' : '20:00'),
        serviceName: upcomingWorkShift.serviceName || 'Servicio Hospitalario',
        serviceLocation: undefined,
        confirmationStatus: upcomingWorkShift.confirmationStatus,
        canConfirm: true,
      };
    }

    // 3. Mini-Dashboard de KPIs Personales calculados con los turnos reales del mes
    const workShiftsThisMonth = currentMonthData.shifts.filter((s) => s.isWorkDay);
    const dayShiftsCount = workShiftsThisMonth.filter((s) => s.sigla === 'L' || s.sigla === 'D').length;
    const nightShiftsCount = workShiftsThisMonth.filter((s) => s.sigla === 'N').length;
    const dayHours = dayShiftsCount * 12;
    const nightHours = nightShiftsCount * 12;

    const kpis = {
      shiftsCompleted: workShiftsThisMonth.filter((s) => s.date < todayStr).length,
      shiftsRemaining: workShiftsThisMonth.filter((s) => s.date >= todayStr).length,
      replacementsCount: currentMonthData.replacementContracts.length,
      dayHours,
      nightHours,
      totalHours: dayHours + nightHours,
    };

    // 4. Agenda Semanal (Próximos 7 días)
    const weeklyAgenda: PortalHomeSummaryDTO['weeklyAgenda'] = [];
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      let shiftMatch = currentMonthData.shifts.find((s) => s.date === dStr);
      if (!shiftMatch && d.getMonth() !== today.getMonth()) {
        const dMonth = d.getMonth() + 1;
        const dYear = d.getFullYear();
        const nextMonthData = await PwaShiftsService.getShifts(staffId, dMonth, dYear);
        shiftMatch = nextMonthData.shifts.find((s) => s.date === dStr);
      }

      const isWork = !!shiftMatch?.isWorkDay;
      const sigla = shiftMatch?.sigla || (shiftMatch ? 'X' : '-');

      let shiftName = 'Sin turno';
      if (isWork) {
        shiftName = sigla === 'N' ? 'Turno Noche (20:00 - 08:00)' : 'Turno Largo (08:00 - 20:00)';
      } else if (shiftMatch?.isReplacement && sigla === 'X') {
        shiftName = 'Libre (Reemplazo)';
      } else if (sigla === 'X') {
        shiftName = 'Libre';
      }

      weeklyAgenda.push({
        date: dStr,
        dayName: dayNames[d.getDay()],
        sigla: sigla === '-' ? '' : sigla,
        isWorkDay: isWork,
        isReplacement: !!shiftMatch?.isReplacement,
        shiftName,
        serviceName: shiftMatch?.serviceName || (isWork ? (nextShift?.serviceName || 'Servicio Hospitalario') : ''),
      });
    }

    return {
      nextShift,
      kpis,
      weeklyAgenda,
    };
  }

  static async getShifts(
    staffId: string,
    month: number,
    year: number
  ): Promise<PortalShiftsResponseDTO> {
    const periodStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const periodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    let isHonorario = false;
    try {
      const staffQuery: any = Staff.findById(staffId);
      if (staffQuery) {
        let staffDoc: any;
        if (typeof staffQuery.select === 'function') {
          const selQuery = staffQuery.select('contractType');
          staffDoc = typeof selQuery?.lean === 'function' ? await selQuery.lean() : await selQuery;
        } else {
          staffDoc = await staffQuery;
        }
        isHonorario = staffDoc?.contractType === 'HONORARIO';
      }
    } catch {
      isHonorario = false;
    }

    const [rawAssignments, replacements, confirmations, periodDoc] = await Promise.all([
      TurnAssignment.find({
        staffId,
        start_date: { $lte: periodEnd },
        end_date: { $gte: periodStart },
      }).populate(['service', 'turn_type']),
      Replacement.find({
        id_entrante: staffId,
        fecha_inicio: { $lte: periodEnd },
        fecha_termino: { $gte: periodStart },
        status: { $nin: ['anulado', 'ANULADO'] },
      }).populate(['servicio', 'turn_type_id']),
      ShiftConfirmation.find({
        staffId,
        date: { $gte: periodStart, $lte: periodEnd },
      }),
      Period.findOne({ month, year }),
    ]);

    // Los funcionarios con contrato HONORARIO no tienen rol de planta regular;
    // sus jornadas son EXCLUSIVAMENTE las derivadas de sus contratos de reemplazo vigentes.
    const assignments = isHonorario ? [] : rawAssignments;

    const isClosed = periodDoc?.status === 'CLOSED';

    // Helper estricto de fechas (inmune a desplazamientos por zona horaria UTC vs Local)
    const toIsoDateStr = (d: any): string => {
      if (!d) return '';
      if (typeof d === 'string') return d.slice(0, 10);
      if (d instanceof Date) return d.toISOString().slice(0, 10);
      return String(d).slice(0, 10);
    };

    // Cargar mapa de TurnTypes si hay reemplazos que necesiten resolución dinámica de secuencia
    const hasUnresolvedRep = replacements.some(
      (rep: any) =>
        (!rep.snapshot_secuencia || rep.snapshot_secuencia.length === 0) &&
        (!rep.turn_type_id?.secuencia || rep.turn_type_id.secuencia.length === 0) &&
        rep.tipo_turno
    );

    const turnTypeMap = new Map<string, any[]>();
    if (hasUnresolvedRep) {
      try {
        const { default: TurnTypeModel } = await import('../models/turn-type.model');
        const allTurnTypes = await TurnTypeModel.find({ deleted_at: null }).lean();
        allTurnTypes.forEach((tt: any) => {
          if (tt.nombre && tt.secuencia) {
            turnTypeMap.set(
              tt.nombre.trim().toUpperCase(),
              tt.secuencia.map(({ color, ...rest }: any) => rest)
            );
          }
        });
      } catch {
        // Fallback si el modelo no está disponible
      }
    }

    // Formatear cartola de contratos de reemplazo con cálculo dinámico de jornadas comprometidas
    const replacementContracts: PortalReplacementContractDTO[] = replacements.map((rep: any) => {
      const repStartStr = toIsoDateStr(rep.fecha_inicio);
      const repEndStr = toIsoDateStr(rep.fecha_termino);
      const dStart = new Date(`${repStartStr}T00:00:00Z`).getTime();
      const dEnd = new Date(`${repEndStr}T00:00:00Z`).getTime();
      const diffTime = Math.max(0, dEnd - dStart);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const serviceObj: any = rep.servicio;
      const businessCode = rep.id_negocio || `REP-${repStartStr.slice(0, 4)}-${rep._id.toString().slice(-4).toUpperCase()}`;

      // Secuencia efectiva (Snapshot > Relación TurnType > Lookup Dinámico)
      let seq = (rep.snapshot_secuencia && rep.snapshot_secuencia.length > 0)
        ? rep.snapshot_secuencia
        : ((rep.turn_type_id as any)?.secuencia || []);

      if ((!seq || seq.length === 0) && rep.tipo_turno) {
        const matched = turnTypeMap.get(rep.tipo_turno.trim().toUpperCase());
        if (matched && matched.length > 0) {
          seq = matched;
        }
      }

      // Cálculo 100% dinámico de turnos comprometidos a lo largo de todo el período del contrato
      let committedShifts = 0;
      if (seq && seq.length > 0 && diffDays > 0) {
        for (let i = 0; i < diffDays; i++) {
          const step = seq[i % seq.length];
          const sigla = (step?.sigla || '').trim().toUpperCase();
          const isWork = !step?.es_libre && sigla !== 'X' && sigla !== '-';
          if (isWork) {
            committedShifts++;
          }
        }
      } else {
        committedShifts = diffDays;
      }

      return {
        id: rep._id.toString(),
        businessCode,
        serviceId: serviceObj?._id ? serviceObj._id.toString() : (serviceObj?.toString() || ''),
        serviceName: serviceObj?.nombre || 'Servicio Hospitalario',
        startDate: repStartStr,
        endDate: repEndStr,
        totalDays: diffDays,
        status: (rep.corte_anticipado ? 'Corte Anticipado' : (rep.status === 'finalizado' ? 'Finalizado' : 'Activo')) as any,
        shiftsCommittedCount: committedShifts,
        origin: 'Asignación Directa',
      };
    });

    // Formatear lista de turnos diarios del mes
    const daysInMonth = periodEnd.getUTCDate();
    const shifts: PortalShiftItemDTO[] = [];

    const confirmationsMap = new Map<string, string>();
    (confirmations || []).forEach((c: any) => {
      const key = `${new Date(c.date).toISOString().slice(0, 10)}`;
      confirmationsMap.set(key, c.status);
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const currentDate = new Date(`${dateStr}T00:00:00Z`);

      // 1. Evaluar si cae dentro de un Reemplazo activo (comparación por string YYYY-MM-DD estricto)
      const activeRep = replacements.find((rep: any) => {
        const repStartStr = toIsoDateStr(rep.fecha_inicio);
        const repEndStr = toIsoDateStr(rep.fecha_termino);
        return dateStr >= repStartStr && dateStr <= repEndStr;
      });

      if (activeRep) {
        const repStartStr = toIsoDateStr(activeRep.fecha_inicio);
        const dCurrent = new Date(`${dateStr}T00:00:00Z`).getTime();
        const dStart = new Date(`${repStartStr}T00:00:00Z`).getTime();
        const diffDays = Math.round((dCurrent - dStart) / (1000 * 60 * 60 * 24));

        let seq = (activeRep.snapshot_secuencia && activeRep.snapshot_secuencia.length > 0)
          ? activeRep.snapshot_secuencia
          : ((activeRep.turn_type_id as any)?.secuencia || []);

        if ((!seq || seq.length === 0) && activeRep.tipo_turno) {
          const matched = turnTypeMap.get(activeRep.tipo_turno.trim().toUpperCase());
          if (matched && matched.length > 0) {
            seq = matched;
          }
        }

        let sigla = '';
        let isWork = false;
        let entryTime: string | undefined = undefined;
        let exitTime: string | undefined = undefined;

        if (seq.length > 0 && diffDays >= 0) {
          const step = seq[diffDays % seq.length];
          sigla = step.sigla || '';
          isWork = !step.es_libre && sigla !== 'X' && sigla !== '-';
          entryTime = step.turno_entrada || (isWork ? (sigla === 'N' ? '20:00' : '08:00') : undefined);
          exitTime = step.turno_salida || (isWork ? (sigla === 'N' ? '08:00' : '20:00') : undefined);
        } else {
          // Sanitización estricta: Una sigla jamás debe ser una frase o nombre largo como "CUARTO TURNO"
          const rawSigla = (activeRep.tipo_turno || '').trim();
          sigla = rawSigla.length <= 2 ? rawSigla : 'L';
          isWork = sigla !== 'X' && sigla !== '-';
          entryTime = isWork ? (sigla === 'N' ? '20:00' : '08:00') : undefined;
          exitTime = isWork ? (sigla === 'N' ? '08:00' : '20:00') : undefined;
        }

        const serviceObj: any = activeRep.servicio;
        const businessCode = activeRep.id_negocio || `REP-${repStartStr.slice(0, 4)}-${activeRep._id.toString().slice(-4).toUpperCase()}`;

        shifts.push({
          date: dateStr,
          sigla,
          isWorkDay: isWork,
          isReplacement: true,
          replacementId: activeRep._id.toString(),
          replacementBusinessCode: businessCode,
          serviceId: serviceObj?._id ? serviceObj._id.toString() : (serviceObj?.toString() || ''),
          serviceName: serviceObj?.nombre || 'Servicio Hospitalario',
          entryTime: isWork ? entryTime : undefined,
          exitTime: isWork ? exitTime : undefined,
          confirmationStatus: confirmationsMap.get(dateStr) as any,
        });
        continue;
      }

      // 2. Si no hay reemplazo, evaluar si tiene asignación de rol de turnos regular (Planta / Contrata)
      const activeAsgn = assignments.find((asgn: any) => {
        const asgnStart = new Date(asgn.start_date);
        asgnStart.setHours(0, 0, 0, 0);
        const asgnEnd = asgn.end_date ? new Date(asgn.end_date) : new Date(9999, 11, 31);
        asgnEnd.setHours(23, 59, 59, 999);
        return currentDate >= asgnStart && currentDate <= asgnEnd;
      });

      if (activeAsgn) {
        const asgnStart = new Date(activeAsgn.start_date);
        asgnStart.setHours(0, 0, 0, 0);
        const diffDays = Math.round((currentDate.getTime() - asgnStart.getTime()) / (1000 * 60 * 60 * 24));
        const seq = (activeAsgn.snapshot_secuencia && activeAsgn.snapshot_secuencia.length > 0)
          ? activeAsgn.snapshot_secuencia
          : ((activeAsgn.turn_type as any)?.secuencia || []);

        let sigla = '';
        let isWork = false;
        let entryTime: string | undefined = undefined;
        let exitTime: string | undefined = undefined;

        if (seq.length > 0 && diffDays >= 0) {
          const step = seq[diffDays % seq.length];
          sigla = step.sigla || '';
          isWork = !step.es_libre && sigla !== 'X' && sigla !== '-';
          entryTime = step.turno_entrada || (isWork ? (sigla === 'N' ? '20:00' : '08:00') : undefined);
          exitTime = step.turno_salida || (isWork ? (sigla === 'N' ? '08:00' : '20:00') : undefined);
        } else {
          sigla = 'L';
          isWork = true;
          entryTime = '08:00';
          exitTime = '20:00';
        }

        const serviceObj: any = activeAsgn.service;

        shifts.push({
          date: dateStr,
          sigla,
          isWorkDay: isWork,
          isReplacement: false,
          serviceId: serviceObj?._id ? serviceObj._id.toString() : (serviceObj?.toString() || ''),
          serviceName: serviceObj?.nombre || 'Servicio Hospitalario',
          entryTime: isWork ? entryTime : undefined,
          exitTime: isWork ? exitTime : undefined,
          confirmationStatus: confirmationsMap.get(dateStr) as any,
        });
        continue;
      }

      // 3. Día sin programación ni reemplazo (libre / sin turnos)
      shifts.push({
        date: dateStr,
        sigla: '',
        isWorkDay: false,
        isReplacement: false,
        serviceId: '',
        serviceName: '',
        entryTime: undefined,
        exitTime: undefined,
      });
    }

    return {
      period: { month, year },
      isClosed,
      shifts,
      replacementContracts,
    };
  }

  static async confirmShift(
    staffId: string,
    assignmentId: string,
    assignmentModel: 'TurnAssignment' | 'Replacement',
    dateStr: string
  ): Promise<{ success: boolean; message: string }> {
    let serviceId: mongoose.Types.ObjectId;

    if (assignmentModel === 'Replacement') {
      const rep = await Replacement.findById(assignmentId).populate('servicio');
      if (!rep) {
        const error: any = new Error('Reemplazo no encontrado');
        error.status = 404;
        throw error;
      }
      const entranteId = (rep.id_entrante as any)?._id?.toString() || (rep.id_entrante as any)?.toString();
      if (entranteId !== staffId) {
        const error: any = new Error('No tienes autorización para confirmar este turno');
        error.status = 403;
        throw error;
      }
      serviceId = (rep.servicio as any)?._id || rep.servicio;
    } else {
      const asgn = await TurnAssignment.findById(assignmentId).populate('service');
      if (!asgn) {
        const error: any = new Error('Turno no encontrado');
        error.status = 404;
        throw error;
      }
      const asgnStaffId = (asgn.staffId as any)?._id?.toString() || (asgn.staffId as any)?.toString();
      if (asgnStaffId !== staffId) {
        const error: any = new Error('No tienes autorización para confirmar este turno');
        error.status = 403;
        throw error;
      }
      serviceId = (asgn.service as any)?._id || asgn.service;
    }

    const targetDate = new Date(dateStr);

    await ShiftConfirmation.findOneAndUpdate(
      { staffId, assignmentId, date: targetDate },
      {
        $set: {
          staffId,
          assignmentId,
          assignmentModel,
          serviceId,
          date: targetDate,
          status: 'confirmed',
          confirmedAt: new Date(),
          source: 'pwa',
        },
      },
      { upsert: true, new: true }
    );

    return {
      success: true,
      message: 'Asistencia confirmada exitosamente',
    };
  }

  static async reportUnavailable(
    staffId: string,
    assignmentId: string,
    assignmentModel: 'TurnAssignment' | 'Replacement',
    dateStr: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    let serviceId: mongoose.Types.ObjectId;
    let serviceName = 'Servicio Clínico';

    if (assignmentModel === 'Replacement') {
      const rep = await Replacement.findById(assignmentId).populate('servicio');
      if (!rep) {
        const error: any = new Error('Reemplazo no encontrado');
        error.status = 404;
        throw error;
      }
      const entranteId = (rep.id_entrante as any)?._id?.toString() || (rep.id_entrante as any)?.toString();
      if (entranteId !== staffId) {
        const error: any = new Error('No tienes autorización para reportar este turno');
        error.status = 403;
        throw error;
      }
      serviceId = (rep.servicio as any)?._id || rep.servicio;
      serviceName = (rep.servicio as any)?.nombre || serviceName;
    } else {
      const asgn = await TurnAssignment.findById(assignmentId).populate('service');
      if (!asgn) {
        const error: any = new Error('Turno no encontrado');
        error.status = 404;
        throw error;
      }
      const asgnStaffId = (asgn.staffId as any)?._id?.toString() || (asgn.staffId as any)?.toString();
      if (asgnStaffId !== staffId) {
        const error: any = new Error('No tienes autorización para reportar este turno');
        error.status = 403;
        throw error;
      }
      serviceId = (asgn.service as any)?._id || asgn.service;
      serviceName = (asgn.service as any)?.nombre || serviceName;
    }

    const targetDate = new Date(dateStr);

    // 1. Guardar en ShiftConfirmation
    await ShiftConfirmation.findOneAndUpdate(
      { staffId, assignmentId, date: targetDate },
      {
        $set: {
          staffId,
          assignmentId,
          assignmentModel,
          serviceId,
          date: targetDate,
          status: 'unavailable',
          reason,
          confirmedAt: new Date(),
          source: 'pwa',
        },
      },
      { upsert: true, new: true }
    );

    // 2. Crear alerta crítica persistente OPS-03 en MongoDB
    const staff = await Staff.findById(staffId);
    const staffName = staff ? `${staff.firstName} ${staff.lastName}`.trim() : 'Funcionario';

    const alert = await Alert.create({
      ruleId: 'OPS-03',
      severity: 'critical',
      category: 'operational',
      serviceId,
      staffId,
      date: targetDate,
      message: `Indisponibilidad reportada por ${staffName} (${dateStr}): ${reason}`,
      context: {
        reason,
        assignmentId,
        assignmentModel,
        serviceName,
      },
      status: 'active',
    });

    // 3. Emitir WebSocket en tiempo real hacia jefatura
    socketService.emitAlertNew(serviceId.toString(), {
      id: alert._id.toString(),
      ruleId: 'OPS-03',
      severity: 'critical',
      category: 'operational',
      serviceId: serviceId.toString(),
      staffId,
      staffName,
      rut: staff?.rut,
      date: dateStr,
      message: alert.message,
      context: alert.context,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Aviso de indisponibilidad registrado y notificado a jefatura',
    };
  }

  static async updatePreferences(
    staffId: string,
    dto: UpdatePreferencesDTO
  ): Promise<{ success: boolean; message: string }> {
    const updateQuery: any = {};

    if (dto.shiftReminders !== undefined) {
      updateQuery['notificationPreferences.shiftReminders'] = dto.shiftReminders;
    }
    if (dto.shiftChanges !== undefined) {
      updateQuery['notificationPreferences.shiftChanges'] = dto.shiftChanges;
    }
    if (dto.openCallsEnabled !== undefined) {
      updateQuery['notificationPreferences.openCallsEnabled'] = dto.openCallsEnabled;
    }
    if (dto.preferredServices !== undefined) {
      updateQuery['notificationPreferences.preferredServices'] = dto.preferredServices;
    }
    if (dto.quietHours !== undefined) {
      updateQuery['notificationPreferences.quietHours'] = dto.quietHours;
    }

    await Staff.findByIdAndUpdate(
      staffId,
      { $set: updateQuery },
      { new: true }
    );

    return {
      success: true,
      message: 'Preferencias de notificación actualizadas exitosamente',
    };
  }
}

export default PwaShiftsService;

import mongoose from "mongoose";
import {
  TurnAssignmentModel,
  ITurnAssignment,
} from "../models/turn-assignment.model";
import Staff, { IStaff } from "../models/staff.model";
import Replacement, { IReplacement } from "../models/replacement.model";
import Service from "../models/service.model";
import { TurnSigla } from "../models/turn-sigla.model";
import Period from "../models/period.model";
import ReportSnapshot from "../models/report-snapshot.model";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { AppError } from "../errors/app-error";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// Helper: Parsea HH:mm a minutos totales desde inicio del día (00:00)
const parseTime = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// Constantes Configurables: Definición de Horario Diurno/Nocturno
// Esto debería venir de configuración, pero por ley/regla de negocio se estandariza usualmente así.
const DAY_START = 8 * 60; // 08:00
const DAY_END = 20 * 60; // 20:00

interface TimeMetrics {
  totalHours: number;
  dayHours: number;
  nightHours: number;
}

// Cálculo de Métricas Horarias (Día vs Noche)
// Algoritmo crítico para payroll: Determina cuántas horas caen en segmento diurno vs nocturno
// dada una hora de entrada y salida, considerando cruce de medianoche.
export const calculateDayNightMetrics = (
  entry?: string,
  exit?: string,
): TimeMetrics => {
  if (!entry || !exit) return { totalHours: 0, dayHours: 0, nightHours: 0 };

  const start = parseTime(entry);
  const end = parseTime(exit);

  let durationMinutes = end - start;
  // Ajuste de cruce de medianoche (ej: 20:00 a 08:00, diff es negativa, sumamos 24h)
  if (durationMinutes <= 0) durationMinutes += 24 * 60;

  const totalHours = Number((durationMinutes / 60).toFixed(2));

  // --- Lógica de Intersección ---
  // Ventana Diurna Objetivo: [DAY_START, DAY_END]
  // Intervalo de Turno: [start, end]
  let dayMinutes = 0;

  // Caso 1: Turno dentro del mismo día (ej: 08:00 a 20:00)
  if (end > start) {
    const workStart = Math.max(start, DAY_START);
    const workEnd = Math.min(end, DAY_END);
    if (workEnd > workStart) {
      dayMinutes = workEnd - workStart;
    }
  } else {
    // Caso 2: Turno Nocturno/Cruce (ej: 20:00 a 08:00)
    // Se divide en dos tramos: start->24:00 y 00:00->end

    // Tramo 1: start -> medianoche
    const firstLegStart = Math.max(start, DAY_START);
    const firstLegEnd = Math.min(24 * 60, DAY_END);
    if (firstLegEnd > firstLegStart) {
      dayMinutes += firstLegEnd - firstLegStart;
    }
    // Tramo 2: medianoche -> end
    const secondLegStart = Math.max(0, DAY_START);
    const secondLegEnd = Math.min(end, DAY_END);
    if (secondLegEnd > secondLegStart) {
      dayMinutes += secondLegEnd - secondLegStart;
    }
  }

  const dayHours = Number((dayMinutes / 60).toFixed(2));
  const nightHours = Number((totalHours - dayHours).toFixed(2));

  return { totalHours, dayHours, nightHours };
};

export interface CalculateParams {
  staff: IStaff;
  month: number;
  year: number;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  daysInMonth: number;
  assignments: ITurnAssignment[];
  replacements: IReplacement[];
  siglaMap: Map<string, any>;
  serviceSet: Set<string>;
  serviceNameMap: Map<string, string>;
}

export const calculateMonthlyReportSync = ({
  staff,
  month,
  year,
  startDate,
  endDate,
  daysInMonth,
  assignments,
  replacements,
  siglaMap,
  serviceSet,
  serviceNameMap,
}: CalculateParams) => {
  const servicesData: any[] = [];
  const grandTotal = {
    hours: 0,
    dayHours: 0,
    nightHours: 0,
    siglasCounts: {} as Record<string, number>,
  };
  const mergedGrid = new Map<number, any>();

  for (const service of serviceSet) {
    let svcHours = 0;
    let svcDayHours = 0;
    let svcNightHours = 0;
    const svcSiglasCounts: Record<string, number> = {};

    const svcAssignments = assignments.filter(
      (a) => a.service?.toString() === service,
    );
    const svcReplacements = replacements.filter(
      (r) => r.servicio?.toString() === service,
    );
    const svcAssignmentIds = svcAssignments.map((a) => String(a._id));
    const svcReplacementIds = svcReplacements.map((r) => String(r._id));
    const allIds = [...svcAssignmentIds, ...svcReplacementIds];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentParamDate = startDate.date(day);
      let activeSigla = "-";

      let activeSource: "replacement" | "assignment" | "exception" | null =
        null;

      const rep = svcReplacements.find(
        (r) =>
          dayjs(r.fecha_inicio).isSameOrBefore(currentParamDate, "day") &&
          dayjs(r.fecha_termino).isSameOrAfter(currentParamDate, "day"),
      );

      if (rep) {
        activeSource = "replacement";
        let matchedSigla = "-";
        const typeName = rep.tipo_turno;

        if ((rep as any).turn_type_id && (rep as any).turn_type_id.secuencia) {
          const turnType = (rep as any).turn_type_id;
          const diff = currentParamDate.diff(
            dayjs(rep.fecha_inicio).startOf("day"),
            "day",
          );
          if (diff >= 0 && turnType.secuencia.length > 0) {
            const idx = diff % turnType.secuencia.length;
            matchedSigla = turnType.secuencia[idx].sigla;
          }
        } else {
          matchedSigla = siglaMap.has(typeName) ? typeName : typeName || "?";
        }
        activeSigla = matchedSigla;
      } else {
        const assign = svcAssignments.find(
          (a) =>
            dayjs(a.start_date).isSameOrBefore(currentParamDate, "day") &&
            (!a.end_date ||
              dayjs(a.end_date).isSameOrAfter(currentParamDate, "day")),
        );

        if (assign) {
          activeSource = "assignment";
          const diff = currentParamDate.diff(
            dayjs(assign.start_date).startOf("day"),
            "day",
          );
          const patternSeq = (assign.turn_type as any).secuencia || [];
          if (patternSeq.length > 0 && diff >= 0) {
            const index = diff % patternSeq.length;
            const patternDay = patternSeq[index];
            activeSigla = patternDay.sigla;
          }
        }
      }

      const siglaData = siglaMap.get(activeSigla);
      const hours = siglaData?.hours || 0;
      const dayHrs = siglaData?.dayHours || 0;
      const nightHrs = siglaData?.nightHours || 0;
      const startTime = siglaData?.start || "-";
      const endTime = siglaData?.end || "-";
      const color = siglaData?.color || "#e2e8f0";

      const isActive = !!activeSource;

      if (hours > 0 || activeSigla !== "-" || isActive) {
        if (hours > 0) {
          svcHours += hours;
          svcDayHours += dayHrs;
          svcNightHours += nightHrs;
        }

        const upperSigla = activeSigla.toUpperCase();
        svcSiglasCounts[upperSigla] = (svcSiglasCounts[upperSigla] || 0) + 1;

        if (!mergedGrid.has(day)) {
          mergedGrid.set(day, {
            date: currentParamDate.toDate(),
            dayNum: day,
            items: [],
          });
        }

        if (activeSigla !== "-" || isActive) {
          mergedGrid.get(day).items.push({
            service: serviceNameMap.get(service) || service,
            sigla: activeSigla,
            hours,
            dayHrs,
            nightHrs,
            startTime,
            endTime,
            color,
            isReplacement: !!rep,
          });
        }
      }
    }

    let earliestDate: dayjs.Dayjs | null = null;

    if (svcAssignments.length > 0) {
      for (const a of svcAssignments) {
        const d = dayjs(a.start_date);
        if (!earliestDate || d.isBefore(earliestDate)) earliestDate = d;
      }
    }
    if (svcReplacements.length > 0) {
      for (const r of svcReplacements) {
        const d = dayjs(r.fecha_inicio);
        if (!earliestDate || d.isBefore(earliestDate)) earliestDate = d;
      }
    }

    servicesData.push({
      serviceName: serviceNameMap.get(service) || service,
      firstInteraction: earliestDate
        ? earliestDate.valueOf()
        : dayjs().valueOf(),
      stats: {
        hours: Number(svcHours.toFixed(2)),
        siglasCounts: svcSiglasCounts,
        dayHours: Number(svcDayHours.toFixed(2)),
        nightHours: Number(svcNightHours.toFixed(2)),
      },
    });
  }

  servicesData.sort((a, b) => {
    if (b.stats.hours !== a.stats.hours) {
      return b.stats.hours - a.stats.hours;
    }
    return a.firstInteraction - b.firstInteraction;
  });

  const timeline: any[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    if (mergedGrid.has(day)) {
      const entry = mergedGrid.get(day);
      entry.isOutOfContract = false;
      timeline.push(entry);
    } else {
      timeline.push({
        date: startDate.date(day).toDate(),
        dayNum: day,
        items: [],
        isOutOfContract: true,
      });
    }
  }

  grandTotal.hours = 0;
  grandTotal.dayHours = 0;
  grandTotal.nightHours = 0;
  grandTotal.siglasCounts = {};

  let totalFreeDays = 0;

  timeline.forEach((dayEntry) => {
    if (dayEntry.isOutOfContract) return;

    if (dayEntry.items.length === 0) {
      totalFreeDays++;
    } else {
      let hasRealShift = false;

      dayEntry.items.forEach((item: any) => {
        grandTotal.hours += item.hours;
        grandTotal.dayHours += item.dayHrs;
        grandTotal.nightHours += item.nightHrs;

        const upperSigla = item.sigla.toUpperCase();
        grandTotal.siglasCounts[upperSigla] =
          (grandTotal.siglasCounts[upperSigla] || 0) + 1;
        if (upperSigla !== "X" && upperSigla !== "-") {
          hasRealShift = true;
        }

        if (item.hours > 0) {
          hasRealShift = true;
        }
      });

      if (!hasRealShift && dayEntry.items.length > 0) {
        if (
          dayEntry.items.some(
            (i: any) => ["X", "-"].includes(i.sigla) || i.hours === 0,
          )
        ) {
          totalFreeDays++;
        }
      }
    }
  });

  const daysWorked = timeline.filter((d) =>
    d.items.some((i: any) => i.hours > 0),
  ).length;

  return {
    staff: {
      _id: staff._id,
      nombre: staff.firstName,
      apellido: staff.lastName,
      rut: staff.rut,
      cargo:
        (staff.positionId as any)?.name ||
        (staff.roleId as any)?.name ||
        "Sin Cargo",
      antiguedad: "N/A", // Placeholder
    },
    metadata: {
      month,
      year,
      generatedAt: new Date(),
    },
    serviceStats: servicesData,
    timeline,
    totals: {
      ...grandTotal,
      daysWorked,
      freeDays: totalFreeDays,
      replacementsCount: new Set(replacements.map((r) => r.rut_saliente)).size,
    },
  };
};

export const getMonthlyReport = async ({
  month,
  year,
  staffId,
}: {
  month: number;
  year: number;
  staffId: string;
}) => {
  const startDate = dayjs()
    .year(year)
    .month(month - 1)
    .startOf("month");
  const endDate = startDate.endOf("month");
  const daysInMonth = endDate.date();

  // 0. Obtener Funcionario
  const staff = await Staff.findById(staffId).populate("roleId positionId");
  if (!staff) throw new AppError(404, "Funcionario no encontrado");

  // 1. Cargar Definiciones de Siglas (Metadata de Turnos)
  const siglasDocs = await TurnSigla.find({});
  const siglaMap = new Map<
    string,
    {
      hours: number;
      dayHours: number;
      nightHours: number;
      start: string;
      end: string;
      color: string;
    }
  >();
  siglasDocs.forEach((s) => {
    // Pre-calculamos métricas para cada tipo de sigla para O(1) lookup luego.
    const metrics = calculateDayNightMetrics(s.turno_entrada, s.turno_salida);
    siglaMap.set(s.sigla, {
      hours: metrics.totalHours,
      dayHours: metrics.dayHours,
      nightHours: metrics.nightHours,
      start: s.turno_entrada || "",
      end: s.turno_salida || "",
      color: s.color,
    });
  });

  // 2. Fetch de Asignaciones (Roles base)
  const assignments = await TurnAssignmentModel.find({
    staffId: staffId,
    start_date: { $lte: endDate.toDate() },
    $or: [{ end_date: { $gte: startDate.toDate() } }, { end_date: null }],
  }).populate("turn_type");

  // 4. Fetch de Reemplazos (Como Funcionario Entrante)
  const replacements = await Replacement.find({
    id_entrante: staffId,
    fecha_inicio: { $lte: endDate.toDate() },
    fecha_termino: { $gte: startDate.toDate() },
  }).populate("turn_type_id");

  // 5. Identificar Servicios Involucrados
  // Un funcionario puede trabajar en múltiples servicios (ej: UCI y Urgencias) en el mismo mes.
  const serviceSet = new Set<string>();
  assignments.forEach((a) => {
    if (a.service) serviceSet.add(a.service.toString());
  });
  replacements.forEach((r) => {
    if (r.servicio) serviceSet.add(r.servicio.toString());
  });

  if (serviceSet.size === 0) {
    throw new AppError(
      404,
      "No se encontraron registros para este funcionario en el periodo seleccionado.",
    );
  }

  // 5.5 Obtener nombres reales de los servicios para la cartola
  const servicesInDb = await Service.find({
    _id: { $in: Array.from(serviceSet) },
  });
  const serviceNameMap = new Map<string, string>();
  servicesInDb.forEach((s) => serviceNameMap.set(s._id.toString(), s.nombre));

  // 6. Ejecutar Lógica de Cálculo Pura Síncrona
  return calculateMonthlyReportSync({
    staff,
    month,
    year,
    startDate,
    endDate,
    daysInMonth,
    assignments,
    replacements,
    siglaMap,
    serviceSet,
    serviceNameMap,
  });
};

export const getMonthlySummaryWithSnapshot = async (month: number, year: number, userId: string) => {
  const period = await Period.findOne({ month, year });
  const isPeriodClosed = period?.status === "CLOSED";

  if (isPeriodClosed) {
    const existing = await ReportSnapshot.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
      period_id: period!._id,
    });

    if (existing) {
      return { ...existing.snapshot_data, _fromSnapshot: true };
    }

    const data = await getMonthlyReport({
      month,
      year,
      staffId: userId,
    });

    await ReportSnapshot.create({
      user_id: new mongoose.Types.ObjectId(userId),
      period_id: period!._id,
      snapshot_data: data as Record<string, unknown>,
      generated_at: new Date(),
    });

    return { ...data, _fromSnapshot: false };
  }

  const data = await getMonthlyReport({
    month,
    year,
    staffId: userId,
  });
  return data;
};

export const getPeriod = async (month: number, year: number) => {
  return Period.findOne({ month, year });
};

import { TurnAssignmentModel } from "../models/turn-assignment.model";
import User from "../models/user.model";
import Replacement from "../models/replacement.model";
import { ShiftExceptionModel } from "../models/shift-exception.model";
import { TurnSigla } from "../models/turn-sigla.model";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import ExcelJS from "exceljs";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface ReportFilters {
  month: number;
  year: number;
  service: string;
}

// Helper: Parse HH:mm to minutes from start of day
const parseTime = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// Configurable constants (could be moved to ENV or DB settings later)
const DAY_START = 8 * 60; // 08:00
const DAY_END = 20 * 60; // 20:00

interface TimeMetrics {
  totalHours: number;
  dayHours: number;
  nightHours: number;
}

const calculateDayNightMetrics = (
  entry?: string,
  exit?: string,
): TimeMetrics => {
  if (!entry || !exit) return { totalHours: 0, dayHours: 0, nightHours: 0 };

  const start = parseTime(entry);
  const end = parseTime(exit);

  let durationMinutes = end - start;
  if (durationMinutes <= 0) durationMinutes += 24 * 60;

  const totalHours = Number((durationMinutes / 60).toFixed(2));

  // Calculate Day Overlap
  // Interval of work: [start, end]. If end < start, it wraps around 24h.
  // Day Window: [DAY_START, DAY_END]

  let dayMinutes = 0;

  // We can simulate the timeline
  // Case 1: Same day (e.g. 08:00 to 20:00)
  if (end > start) {
    const workStart = Math.max(start, DAY_START);
    const workEnd = Math.min(end, DAY_END);
    if (workEnd > workStart) {
      dayMinutes = workEnd - workStart;
    }
  } else {
    // Case 2: Overnight (e.g. 20:00 to 08:00)
    // Part 1: start to 24:00
    const firstLegStart = Math.max(start, DAY_START);
    const firstLegEnd = Math.min(24 * 60, DAY_END);
    if (firstLegEnd > firstLegStart) {
      dayMinutes += firstLegEnd - firstLegStart;
    }
    // Part 2: 00:00 to end
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

export const getMonthlyReport = async ({
  month,
  year,
  userId,
}: {
  month: number;
  year: number;
  userId: string;
}) => {
  const startDate = dayjs()
    .year(year)
    .month(month - 1)
    .startOf("month");
  const endDate = startDate.endOf("month");
  const daysInMonth = endDate.date();

  // 0. Fetch User
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "Funcionario no encontrado" };

  // 1. Fetch Sigla Definitions
  const siglasDocs = await TurnSigla.find({});
  const siglaMap = new Map<
    string,
    {
      hours: number;
      dayHours: number;
      nightHours: number;
      start: string;
      end: string;
    }
  >();
  siglasDocs.forEach((s) => {
    const metrics = calculateDayNightMetrics(s.turno_entrada, s.turno_salida);
    siglaMap.set(s.sigla, {
      hours: metrics.totalHours,
      dayHours: metrics.dayHours,
      nightHours: metrics.nightHours,
      start: s.turno_entrada || "",
      end: s.turno_salida || "",
    });
  });

  // 2. Fetch All Assignments for User (Any Service)
  const assignments = await TurnAssignmentModel.find({
    user_id: userId,
    start_date: { $lte: endDate.toDate() },
    $or: [{ end_date: { $gte: startDate.toDate() } }, { end_date: null }],
  }).populate("turn_type");

  // 3. Fetch All Replacements for User (As Entrante, Any Service)
  const replacements = await Replacement.find({
    id_entrante: userId,
    fecha_inicio: { $lte: endDate.toDate() },
    fecha_termino: { $gte: startDate.toDate() },
  }).populate("turn_type_id");

  // 4. Fetch All Exceptions
  const assignmentIds = assignments.map((a) => a._id);
  const replacementIds = replacements.map((r) => r._id);
  const allIds = [...assignmentIds, ...replacementIds];

  const exceptions = await ShiftExceptionModel.find({
    assignment_id: { $in: allIds },
    date: { $gte: startDate.toDate(), $lte: endDate.toDate() },
  });

  // 5. Identify Distinct Services Involved
  const serviceSet = new Set<string>();
  assignments.forEach((a) => serviceSet.add(a.service));
  replacements.forEach((r) => serviceSet.add(r.servicio));

  // Validation: Any shifts?
  if (serviceSet.size === 0) {
    throw {
      status: 404, // Not Found
      message:
        "No se encontraron turnos o reemplazos para este usuario en el periodo seleccionado.",
    };
  }

  // 6. Calculate Stats Per Service AND Merged Grid
  const servicesData: any[] = [];
  const grandTotal = { hours: 0, L: 0, N: 0, X: 0, dayHours: 0, nightHours: 0 };
  const mergedGrid = new Map<number, any>();

  for (const service of serviceSet) {
    let svcHours = 0;
    let svcL = 0;
    let svcN = 0;
    let svcX = 0;
    let svcDayHours = 0;
    let svcNightHours = 0;

    // Filter for this Service
    const svcAssignments = assignments.filter((a) => a.service === service);
    const svcReplacements = replacements.filter((r) => r.servicio === service);
    const svcAssignmentIds = svcAssignments.map((a) => String(a._id));
    const svcReplacementIds = svcReplacements.map((r) => String(r._id));
    const allIds = [...svcAssignmentIds, ...svcReplacementIds];

    const svcExceptions = exceptions.filter((e) =>
      allIds.includes(String(e.assignment_id)),
    );

    // Iterate Days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentParamDate = startDate.date(day);
      let activeSigla = "-";

      let activeSource: "replacement" | "assignment" | "exception" | null =
        null;

      // A. Priority 1: Replacement
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
          ); // Explicit startOf day
          if (diff >= 0 && turnType.secuencia.length > 0) {
            const idx = diff % turnType.secuencia.length;
            matchedSigla = turnType.secuencia[idx].sigla;
          }
        } else {
          // Fallback: Use typeName directly as Sigla (legacy support relies on DB aliases if implemented)
          matchedSigla = siglaMap.has(typeName) ? typeName : typeName || "?";
        }
        activeSigla = matchedSigla;
      } else {
        // B. Priority 2: Assignment
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

      // C. Priority 0: Exception (Override)
      const exception = svcExceptions.find((e) =>
        dayjs(e.date).isSame(currentParamDate, "day"),
      );
      if (exception) {
        activeSource = "exception";
        activeSigla = exception.override_type;
      }

      // ... Inside loop ...

      // Calculations
      const siglaData = siglaMap.get(activeSigla);
      const hours = siglaData?.hours || 0;
      const dayHrs = siglaData?.dayHours || 0;
      const nightHrs = siglaData?.nightHours || 0;
      const startTime = siglaData?.start || "-";
      const endTime = siglaData?.end || "-";

      // Check if day is active
      const isActive = !!activeSource;

      if (hours > 0 || activeSigla !== "-" || isActive) {
        // Add to Service Stats
        if (hours > 0) {
          svcHours += hours;
          svcDayHours += dayHrs;
          svcNightHours += nightHrs;
        }

        const upperSigla = activeSigla.toUpperCase();
        if (upperSigla === "L") svcL++;
        else if (upperSigla === "N") svcN++;
        else if (upperSigla === "X") svcX++;

        // Add to Global Merged Grid
        if (!mergedGrid.has(day)) {
          mergedGrid.set(day, {
            date: currentParamDate.toDate(),
            dayNum: day,
            items: [],
          });
        }

        // Push even if sigla is "-", provided it's active (so we know it's a "working day" turned empty, or explicitly free)
        // But if sigla is "-", we treat as free/empty within contract
        if (activeSigla !== "-" || isActive) {
          mergedGrid.get(day).items.push({
            service: service,
            sigla: activeSigla,
            hours,
            dayHrs,
            nightHrs,
            startTime,
            endTime,
            isReplacement: !!rep,
          });
        }
      }
    }

    // Find earliest interaction for this service (Assignment or Replacement)
    let earliestDate = dayjs("2099-12-31");

    if (svcAssignments.length > 0) {
      svcAssignments.forEach((a) => {
        const d = dayjs(a.start_date);
        if (d.isBefore(earliestDate)) earliestDate = d;
      });
    }
    if (svcReplacements.length > 0) {
      svcReplacements.forEach((r) => {
        const d = dayjs(r.fecha_inicio);
        if (d.isBefore(earliestDate)) earliestDate = d;
      });
    }

    // Push Service Block
    servicesData.push({
      serviceName: service,
      firstInteraction: earliestDate.valueOf(), // Store timestamp for sorting
      stats: {
        hours: Number(svcHours.toFixed(2)),
        L: svcL,
        N: svcN,
        X: svcX,
        dayHours: Number(svcDayHours.toFixed(2)),
        nightHours: Number(svcNightHours.toFixed(2)),
      },
    });
  }

  // Sort Services:
  // 1. Most Hours (Descending)
  // 2. Earliest Date (Ascending)
  servicesData.sort((a, b) => {
    if (b.stats.hours !== a.stats.hours) {
      return b.stats.hours - a.stats.hours;
    }
    return a.firstInteraction - b.firstInteraction;
  });

  // Flatten Merged Grid
  const timeline: any[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    if (mergedGrid.has(day)) {
      const entry = mergedGrid.get(day);
      entry.isOutOfContract = false;
      timeline.push(entry);
    }
    // Else: Day is out of contract (not in mergedGrid), so exclude from timeline completely.
  }

  // Recalculate Grand Totals based on actual content
  grandTotal.hours = 0;
  grandTotal.L = 0;
  grandTotal.N = 0;
  grandTotal.X = 0;
  grandTotal.dayHours = 0;
  grandTotal.nightHours = 0;

  let totalFreeDays = 0;

  timeline.forEach((dayEntry) => {
    // Skip Out of Contract days for stats
    if (dayEntry.isOutOfContract) return;

    // If no items but NOT out of contract, it's a free day
    if (dayEntry.items.length === 0) {
      totalFreeDays++;
    } else {
      let isFreeShiftDay = false;
      let hasRealShift = false;

      dayEntry.items.forEach((item: any) => {
        grandTotal.hours += item.hours;
        grandTotal.dayHours += item.dayHrs;
        grandTotal.nightHours += item.nightHrs;

        const upperSigla = item.sigla.toUpperCase();
        if (upperSigla === "L") {
          grandTotal.L++;
          hasRealShift = true;
        } else if (upperSigla === "N") {
          grandTotal.N++;
          hasRealShift = true;
        } else if (upperSigla === "X") {
          grandTotal.X++;
          isFreeShiftDay = true;
        }

        if (item.hours > 0) {
          hasRealShift = true;
        } else if (item.sigla === "-") {
          // Active but empty sigla -> Potentially free day?
        }

        // Removed per-day replacement count. Replaced by unique people count.
      });

      // If the only item is an explicit "X" (or dash with 0 hours), count as free day
      if (!hasRealShift && dayEntry.items.length > 0) {
        // Check if ANY item is 'X' or just empty placeholder
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

  // Calculate actual working days (days with at least one working shift)
  const daysWorked = timeline.filter((d) =>
    d.items.some((i: any) => i.hours > 0),
  ).length;

  return {
    user: {
      nombre: user.nombre,
      apellido: user.apellido,
      rut: user.rut,
      dv: calculateDV(user.rut),
      cargo: user.tipo_cargo,
      // Add antiquity if available (not in model yet, placeholder)
      antiguedad: "N/A",
    },
    metadata: {
      month,
      year,
      generatedAt: new Date(),
    },
    serviceStats: servicesData, // For charts
    timeline, // Chronological Day-by-Day
    totals: {
      ...grandTotal,
      daysWorked,
      freeDays: totalFreeDays,
      replacementsCount: new Set(replacements.map((r) => r.rut_saliente)).size,
    },
  };
};

function calculateDV(rut: string) {
  // Simple placeholder, real apps use specific algorithm
  return "K";
}

export const generateExcelReport = async (data: any, filters: any) => {
  // TODO: Update Excel generation for Single User Statement
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Cartola Funcionario");

  // Simple Dump for now
  sheet.addRow(["Reporte de Asistencia"]);
  sheet.addRow([`Funcionario: ${data.user.nombre} ${data.user.apellido}`]);
  sheet.addRow([`RUT: ${data.user.rut}`]);
  sheet.addRow([]);

  data.services.forEach((svc: any) => {
    sheet.addRow([`SERVICIO: ${svc.serviceName}`]);
    sheet.addRow(["Día", "Turno", "Horas"]);
    svc.grid.forEach((g: any) => {
      sheet.addRow([g.day, g.sigla, g.hours]);
    });
    sheet.addRow(["Total Servicio", "", svc.stats.hours]);
    sheet.addRow([]);
  });

  sheet.addRow(["TOTAL GENERAL", "", data.totals.hours]);

  return workbook;
};

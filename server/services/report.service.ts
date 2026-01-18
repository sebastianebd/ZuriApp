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

// Helper: Calculate duration between two HH:mm strings
const calculateDuration = (entry?: string, exit?: string): number => {
  if (!entry || !exit) return 0;

  const [h1, m1] = entry.split(":").map(Number);
  const [h2, m2] = exit.split(":").map(Number);

  let duration = h2 + m2 / 60 - (h1 + m1 / 60);
  if (duration <= 0) duration += 24; // Handle overnight (e.g. 20:00 to 08:00)

  return Number(duration.toFixed(2));
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
    { hours: number; start: string; end: string }
  >();
  siglasDocs.forEach((s) => {
    const hours = calculateDuration(s.turno_entrada, s.turno_salida);
    siglaMap.set(s.sigla, {
      hours,
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
  const exceptions = await ShiftExceptionModel.find({
    assignment_id: { $in: assignmentIds },
    date: { $gte: startDate.toDate(), $lte: endDate.toDate() },
  });

  // 5. Identify Distinct Services Involved
  const serviceSet = new Set<string>();
  assignments.forEach((a) => serviceSet.add(a.service));
  replacements.forEach((r) => serviceSet.add(r.servicio));

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
    const svcExceptions = exceptions.filter((e) =>
      svcAssignmentIds.includes(String(e.assignment_id)),
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
        } else if (siglaMap.has(typeName)) {
          matchedSigla = typeName;
        } else {
          if (typeName === "LARGO") matchedSigla = "L";
          else if (typeName === "NOCHE") matchedSigla = "N";
          else matchedSigla = "?";
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
        // Exception implies active day? Or just overrides?
        // Usually exception overrides an existing day. If standalone, it might enable the day.
        activeSource = "exception";
        if (exception.override_type === "LARGO") activeSigla = "L";
        else if (exception.override_type === "NOCHE") activeSigla = "N";
        else if (exception.override_type === "LIBRE") activeSigla = "X";
        else activeSigla = exception.override_type;
      }

      // ... Inside loop ...

      // Calculations
      const siglaData = siglaMap.get(activeSigla);
      const hours = siglaData?.hours || 0;

      let startTime = siglaData?.start || "-";
      let endTime = siglaData?.end || "-";

      // Heuristic for Split & Defaults for hardcoded Siglas
      let dayHrs = 0;
      let nightHrs = 0;
      if (activeSigla === "L" || activeSigla === "LARGO") {
        dayHrs = 12;
        nightHrs = 0;
        if (startTime === "-") {
          startTime = "08:00";
          endTime = "20:00";
        }
      } else if (activeSigla === "N" || activeSigla === "NOCHE") {
        dayHrs = 0;
        nightHrs = 12;
        if (startTime === "-") {
          startTime = "20:00";
          endTime = "08:00";
        }
      } else if (activeSigla === "24") {
        dayHrs = 12;
        nightHrs = 12;
        if (startTime === "-") {
          startTime = "08:00";
          endTime = "08:00";
        }
      } else if (hours > 0) {
        dayHrs = hours;
        // Default split for generic hours if lacking heuristics, can improve later
      }

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
        if (upperSigla === "L" || upperSigla === "LARGO") svcL++;
        else if (upperSigla === "N" || upperSigla === "NOCHE") svcN++;
        else if (upperSigla === "X" || upperSigla === "LIBRE") svcX++;

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
  let totalReplacements = 0;

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
        if (upperSigla === "L" || upperSigla === "LARGO") {
          grandTotal.L++;
          hasRealShift = true;
        } else if (upperSigla === "N" || upperSigla === "NOCHE") {
          grandTotal.N++;
          hasRealShift = true;
        } else if (upperSigla === "X" || upperSigla === "LIBRE") {
          grandTotal.X++;
          isFreeShiftDay = true;
        } else if (item.hours > 0) {
          hasRealShift = true;
        } else if (item.sigla === "-") {
          // Active but empty sigla -> Potentially free day?
        }

        if (item.isReplacement) totalReplacements++;
      });

      // If the only item is an explicit "X" (or dash with 0 hours), count as free day
      if (!hasRealShift && dayEntry.items.length > 0) {
        // Check if ANY item is 'X' or just empty placeholder
        if (
          dayEntry.items.some(
            (i: any) => ["X", "LIBRE", "-"].includes(i.sigla) || i.hours === 0,
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
      replacementsCount: totalReplacements,
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

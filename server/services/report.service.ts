import { TurnAssignmentModel } from "../models/turn-assignment.model";
import User from "../models/user.model";
import Replacement from "../models/replacement.model";
import Service from "../models/service.model";
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
const calculateDayNightMetrics = (
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
  user: any;
  month: number;
  year: number;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  daysInMonth: number;
  assignments: any[];
  replacements: any[];
  siglaMap: Map<string, any>;
  serviceSet: Set<string>;
  serviceNameMap: Map<string, string>;
}

export const calculateMonthlyReportSync = ({
  user,
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
    user: {
      _id: user._id,
      nombre: user.nombre,
      apellido: user.apellido,
      rut: user.rut,
      cargo: user.tipo_cargo,
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

  // 0. Obtener Usuario
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "Funcionario no encontrado" };

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
    user_id: userId,
    start_date: { $lte: endDate.toDate() },
    $or: [{ end_date: { $gte: startDate.toDate() } }, { end_date: null }],
  }).populate("turn_type");

  // 4. Fetch de Reemplazos (Como Funcionario Entrante)
  const replacements = await Replacement.find({
    id_entrante: userId,
    fecha_inicio: { $lte: endDate.toDate() },
    fecha_termino: { $gte: startDate.toDate() },
  }).populate("turn_type_id");

  // 5. Identificar Servicios Involucrados
  // Un usuario puede trabajar en múltiples servicios (ej: UCI y Urgencias) en el mismo mes.
  const serviceSet = new Set<string>();
  assignments.forEach((a) => {
    if (a.service) serviceSet.add(a.service.toString());
  });
  replacements.forEach((r) => {
    if (r.servicio) serviceSet.add(r.servicio.toString());
  });

  if (serviceSet.size === 0) {
    throw {
      status: 404,
      message:
        "No se encontraron registros para este usuario en el periodo seleccionado.",
    };
  }

  // 5.5 Obtener nombres reales de los servicios para la cartola
  const servicesInDb = await Service.find({
    _id: { $in: Array.from(serviceSet) },
  });
  const serviceNameMap = new Map<string, string>();
  servicesInDb.forEach((s) => serviceNameMap.set(s._id.toString(), s.nombre));

  // 6. Ejecutar Lógica de Cálculo Pura Síncrona
  return calculateMonthlyReportSync({
    user,
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

export const generateIndividualExcelReport = async (
  month: number,
  year: number,
  userId: string,
  period: any,
) => {
  let data: any;
  const isClosed = period && period.status === "CLOSED";

  if (isClosed) {
    const ReportSnapshotModel = (
      await import("../models/report-snapshot.model")
    ).default;
    const snapshot = await ReportSnapshotModel.findOne({
      user_id: userId,
      period_id: period._id,
    });
    if (snapshot) {
      data = snapshot.snapshot_data;
    } else {
      data = await getMonthlyReport({ month, year, userId });
      await ReportSnapshotModel.create({
        user_id: userId,
        period_id: period._id,
        snapshot_data: data,
        generated_at: new Date(),
      });
    }
  } else {
    data = await getMonthlyReport({ month, year, userId });
  }

  if (!data.user.email) {
    const userDoc = await User.findById(userId).select("email");
    if (userDoc) data.user.email = userDoc.email;
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Cartola Funcionario", {
    views: [{ showGridLines: false }],
  });

  // 1. Tamaños de columnas milimétricos
  sheet.columns = [
    { width: 17 }, // A (Fecha Entrada)
    { width: 27 }, // B (Hora Entrada)
    { width: 17 }, // C (Fecha Salida)
    { width: 27 }, // D (Hora Salida)
    { width: 30 }, // E (Servicio)
    { width: 30 }, // F (Tipo Turno)
    { width: 20 }, // G (Hrs Diurnas)
    { width: 20 }, // H (Hrs Nocturnas)
    { width: 20 }, // I (Total Hrs)
  ];

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } },
  };

  // 2. Encabezado Zuri App (Fila 1)
  sheet.mergeCells("A1:B1");
  sheet.mergeCells("G1:I1");
  const row1 = sheet.getRow(1);
  row1.height = 40;
  row1.getCell(1).value = "Zuri App";
  row1.getCell(1).font = { bold: true, color: { argb: "FF006DFC" }, size: 20 };
  row1.getCell(1).alignment = { vertical: "middle", horizontal: "center" };

  const startD = dayjs()
    .year(year)
    .month(month - 1)
    .startOf("month");
  const endD = dayjs()
    .year(year)
    .month(month - 1)
    .endOf("month");

  const monthName = new Intl.DateTimeFormat("es-ES", { month: "long" })
    .format(startD.toDate())
    .toUpperCase();

  const titlePrefix = isClosed
    ? "CARTOLA DE TURNOS"
    : "CARTOLA PARCIAL DE TURNOS";
  row1.getCell(7).value = `${titlePrefix} - ${monthName} ${year}`;
  row1.getCell(7).font = { bold: true, color: { argb: "FF006DFC" }, size: 17 };
  row1.getCell(7).alignment = { vertical: "middle", horizontal: "left" };

  // Borde inferior medio en la Fila 1 (columnas 1 a 9)
  for (let i = 1; i <= 9; i++) {
    row1.getCell(i).border = {
      bottom: { style: "medium", color: { argb: "FF4A86E8" } },
    };
  }

  // 3. Datos del Funcionario (Filas 3 a 5)
  const boldFont = { bold: true };

  sheet.getCell("A3").value = "Sr(a)";
  sheet.getCell("A3").font = boldFont;
  sheet.getCell("B3").value = `${data.user.nombre} ${data.user.apellido}`;
  sheet.getCell("G3").value = "Desde";
  sheet.getCell("G3").font = boldFont;
  sheet.getCell("H3").value = startD.format("DD/MM/YYYY");

  sheet.getCell("A4").value = "Rut";
  sheet.getCell("A4").font = boldFont;
  sheet.getCell("B4").value = `${data.user.rut}-${data.user.dv}`;
  sheet.getCell("G4").value = "Hasta";
  sheet.getCell("G4").font = boldFont;
  sheet.getCell("H4").value = endD.format("DD/MM/YYYY");

  sheet.getCell("A5").value = "E-mail";
  sheet.getCell("A5").font = boldFont;
  sheet.getCell("B5").value = `${data.user.email}` || "N/A";

  // 4. Cabeceras de Tabla (Fila 8)
  sheet.mergeCells("A8:B8");
  sheet.mergeCells("C8:D8");
  const row8 = sheet.getRow(8);
  row8.height = 36;

  const headers = [
    { col: 1, val: "ENTRADA" },
    { col: 3, val: "SALIDA" },
    { col: 5, val: "SERVICIO" },
    { col: 6, val: "TIPO TURNO" },
    { col: 7, val: "HRS DIURNAS" },
    { col: 8, val: "HRS NOCTURNAS" },
    { col: 9, val: "TOTAL HORAS" },
  ];

  headers.forEach((h) => {
    const cell = row8.getCell(h.col);
    cell.value = h.val;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF006DFC" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // Blanco
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = thinBorder;
  });

  // Asegurar bordes para las celdas combinadas B8 y D8
  row8.getCell(2).border = thinBorder;
  row8.getCell(4).border = thinBorder;

  let currentRow = 9;

  // 5. Filas de Datos
  data.timeline.forEach((dayEntry: any) => {
    if (dayEntry.isOutOfContract) return;

    if (dayEntry.items.length === 0) {
      const row = sheet.getRow(currentRow++);
      row.values = [
        dayjs(dayEntry.date).format("DD/MM"),
        "-",
        "-",
        "-",
        "-",
        "LIBRE",
        "-",
        "-",
        "-",
      ];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber <= 9) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = thinBorder;
        }
      });
    } else {
      dayEntry.items.forEach((item: any) => {
        const isFree = item.sigla === "X" || item.sigla === "-";

        let outDateStr = "-";
        let outTimeStr = "-";

        if (!isFree) {
          outDateStr = dayjs(dayEntry.date).format("DD/MM");
          outTimeStr = item.endTime;
          if (item.endTime <= item.startTime && item.endTime !== "-") {
            outDateStr = dayjs(dayEntry.date).add(1, "day").format("DD/MM");
          }
        }

        const row = sheet.getRow(currentRow++);
        row.values = [
          dayjs(dayEntry.date).format("DD/MM"),
          isFree ? "-" : item.startTime,
          isFree ? "-" : outDateStr,
          isFree ? "-" : outTimeStr,
          isFree ? "-" : item.service,
          isFree ? "LIBRE" : item.sigla,
          isFree ? "-" : item.dayHrs,
          isFree ? "-" : item.nightHrs,
          isFree ? "-" : item.hours,
        ];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber <= 9) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.border = thinBorder;
          }
        });
      });
    }
  });

  currentRow += 3;

  // 6. Totales Globales
  sheet.mergeCells(`A${currentRow}:B${currentRow}`);
  const totalHeader = sheet.getRow(currentRow);
  totalHeader.height = 36;
  totalHeader.getCell(1).value = "TOTALES GENERALES";
  totalHeader.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF006DFC" },
  };
  totalHeader.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  totalHeader.getCell(1).alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  totalHeader.getCell(1).border = thinBorder;
  totalHeader.getCell(2).border = thinBorder;

  currentRow++;

  const renderTotalRow = (label: string, value: any) => {
    const row = sheet.getRow(currentRow++);
    row.getCell(1).value = label;
    row.getCell(2).value = value;
    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(2).alignment = { horizontal: "center" };
    row.getCell(1).border = thinBorder;
    row.getCell(2).border = thinBorder;
  };

  renderTotalRow("Días Trabajados", data.totals.daysWorked);
  renderTotalRow("Días Libres", data.totals.freeDays);
  renderTotalRow("Total Horas", data.totals.hours);

  if (data.totals.siglasCounts) {
    Object.entries(data.totals.siglasCounts).forEach(([sigla, count]) => {
      if (sigla === "-" || sigla === "?") return;
      renderTotalRow(`Total ${sigla}`, count);
    });
  }

  if (!isClosed) {
    currentRow += 2;
    sheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const warningRow = sheet.getRow(currentRow);
    warningRow.getCell(1).value =
      "** Esta cartola corresponde a un período en curso. La información puede sufrir modificaciones hasta el cierre mensual **";
    warningRow.getCell(1).font = { bold: true };
    warningRow.getCell(1).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
  }

  return workbook;
};

/**
 * Genera un Excel consolidado por Servicio con Chunking interno.
 * Procesa usuarios de a 10 para mantener la RAM plana y evitar OOM.
 * Reutiliza Snapshots existentes; crea nuevos solo si no hay.
 */
export const generateServiceExcelReport = async ({
  month,
  year,
  serviceId,
  period,
}: {
  month: number;
  year: number;
  serviceId: string;
  period: any;
}) => {
  const startOfMonth = dayjs(
    `${year}-${String(month).padStart(2, "0")}-01`,
  ).toDate();
  const endOfMonth = dayjs(startOfMonth).endOf("month").toDate();

  const ServiceModel = (await import("../models/service.model")).default;
  const serviceDoc = await ServiceModel.findById(serviceId);
  if (!serviceDoc) {
    throw { status: 404, message: "Servicio no encontrado" };
  }

  const assignments = await (
    await import("../models/turn-assignment.model")
  ).TurnAssignmentModel.find({
    service: serviceId,
    start_date: { $lte: endOfMonth },
    $or: [{ end_date: { $gte: startOfMonth } }, { end_date: null }],
  }).distinct("user_id");

  if (assignments.length === 0) {
    throw {
      status: 404,
      message:
        "No se encontraron registros para este servicio en el periodo seleccionado.",
    };
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(
    `Servicio ${serviceId} ${month}-${year}`,
    {
      views: [{ showGridLines: false }],
    },
  );

  // Configurar anchos de las 12 columnas
  sheet.columns = [
    { width: 17 }, // 1. RUT
    { width: 27 }, // 2. NOMBRE
    { width: 28 }, // 3. APELLIDO
    { width: 29.29 }, // 4. CARGO
    { width: 30.29 }, // 5. TIPO CONTRATO
    { width: 24.29 }, // 6. HORAS DIURNAS
    { width: 24.29 }, // 7. HORAS NOCTURAS
    { width: 24.29 }, // 8. TOTAL HORAS
    { width: 24.71 }, // 9. DIAS TRABAJADOS
    { width: 24.71 }, // 10. DIAS LIBRES
    { width: 24.71 }, // 11. DIAS NO ASIGNADOS
  ];

  const isClosed = period && period.status === "CLOSED";

  // 1. Encabezado Zuri App (Fila 1)
  sheet.mergeCells("A1:C1");
  sheet.mergeCells("J1:K1");
  const row1 = sheet.getRow(1);
  row1.height = 47.25;
  row1.getCell(1).value = "Zuri App";
  row1.getCell(1).font = { bold: true, color: { argb: "FF006DFC" }, size: 22 };
  row1.getCell(1).alignment = { vertical: "middle", horizontal: "center" };

  const startD = dayjs(startOfMonth);
  const endD = dayjs(endOfMonth);
  const monthName = new Intl.DateTimeFormat("es-ES", { month: "long" })
    .format(startD.toDate())
    .toUpperCase();

  const titlePrefix = isClosed
    ? "CARTOLA DE SERVICIOS"
    : "CARTOLA DE SERVICIOS PARCIAL";
  row1.getCell(10).value = `${titlePrefix} - ${monthName} ${year}`;
  row1.getCell(10).font = { bold: true, color: { argb: "FF006DFC" }, size: 20 };
  row1.getCell(10).alignment = { vertical: "middle", horizontal: "left" };

  // 2. Metadatos (Filas 3, 4, 5)
  const boldFont = { bold: true };
  sheet.getCell("B3").value = "Servicio";
  sheet.getCell("B3").font = boldFont;
  sheet.getCell("C3").value = serviceDoc.nombre;
  sheet.getCell("J3").value = "Desde";
  sheet.getCell("J3").font = boldFont;
  sheet.getCell("K3").value = startD.format("DD/MM/YYYY");

  sheet.getCell("B4").value = "Codigo";
  sheet.getCell("B4").font = boldFont;
  sheet.getCell("C4").value = serviceDoc.codigo || "S/N";
  sheet.getCell("J4").value = "Hasta";
  sheet.getCell("J4").font = boldFont;
  sheet.getCell("K4").value = endD.format("DD/MM/YYYY");

  sheet.getCell("B5").value = "E-mail";
  sheet.getCell("B5").font = boldFont;
  sheet.getCell("C5").value = serviceDoc.email || "S/N";

  // 3. Cabeceras de la Tabla (Fila 8)
  const headersRow = sheet.getRow(8);
  headersRow.height = 36;
  const headers = [
    "RUT",
    "NOMBRE",
    "APELLIDO",
    "CARGO",
    "TIPO CONTRATO",
    "HORAS DIURNAS",
    "HORAS NOCTURAS",
    "TOTAL HORAS",
    "DIAS TRABAJADOS",
    "DIAS LIBRES",
    "DIAS NO ASIGNADOS",
  ];

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  headers.forEach((h, i) => {
    const cell = headersRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF006DFC" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = thinBorder;
  });

  const missingUserIds: string[] = [];
  const dataMap = new Map<string, any>();
  const userIdsStr = assignments.map((id: any) => id.toString());

  if (isClosed) {
    const ReportSnapshotModel = (
      await import("../models/report-snapshot.model")
    ).default;
    const snapshots = await ReportSnapshotModel.find({
      period_id: period._id,
      user_id: { $in: assignments },
    });

    snapshots.forEach((s: any) =>
      dataMap.set(s.user_id.toString(), s.snapshot_data),
    );

    for (const id of userIdsStr) {
      if (!dataMap.has(id)) missingUserIds.push(id);
    }
  } else {
    missingUserIds.push(...userIdsStr);
  }

  // Fetch all assigned users to read their native fields (tipo_contrato, servicio)
  const allUsersInDb = await User.find({ _id: { $in: userIdsStr } });
  const userDbMap = new Map<string, any>();
  allUsersInDb.forEach((u) => userDbMap.set(u._id.toString(), u));

  if (missingUserIds.length > 0) {
    // BATCH FETCHING
    const users = allUsersInDb.filter((u) =>
      missingUserIds.includes(u._id.toString()),
    );
    const TurnSigla = (await import("../models/turn-sigla.model")).TurnSigla;
    const siglasDocs = await TurnSigla.find({});
    const siglaMap = new Map();
    siglasDocs.forEach((s) => {
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

    const TurnAssignmentModel = (
      await import("../models/turn-assignment.model")
    ).TurnAssignmentModel;
    const allAssignments = await TurnAssignmentModel.find({
      user_id: { $in: missingUserIds },
      start_date: { $lte: endOfMonth },
      $or: [{ end_date: { $gte: startOfMonth } }, { end_date: null }],
    }).populate("turn_type");

    const allReplacements = await Replacement.find({
      id_entrante: { $in: missingUserIds },
      fecha_inicio: { $lte: endOfMonth },
      fecha_termino: { $gte: startOfMonth },
    }).populate("turn_type_id");

    const allServiceIds = new Set<string>();
    allAssignments.forEach((a: any) => {
      if (a.service) allServiceIds.add(a.service.toString());
    });
    allReplacements.forEach((r: any) => {
      if (r.servicio) allServiceIds.add(r.servicio.toString());
    });

    const servicesInDb = await ServiceModel.find({
      _id: { $in: Array.from(allServiceIds) },
    });
    const serviceNameMap = new Map<string, string>();
    servicesInDb.forEach((s) => serviceNameMap.set(s._id.toString(), s.nombre));

    const startDate = dayjs(startOfMonth);
    const endDate = dayjs(endOfMonth);
    const daysInMonth = endDate.date();

    const ReportSnapshotModel = isClosed
      ? (await import("../models/report-snapshot.model")).default
      : null;

    for (const user of users) {
      const userIdStr = user._id.toString();
      const userAssignments = allAssignments.filter(
        (a: any) => a.user_id.toString() === userIdStr,
      );
      const userReplacements = allReplacements.filter(
        (r: any) => r.id_entrante.toString() === userIdStr,
      );

      const serviceSet = new Set<string>();
      userAssignments.forEach((a: any) => {
        if (a.service) serviceSet.add(a.service.toString());
      });
      userReplacements.forEach((r: any) => {
        if (r.servicio) serviceSet.add(r.servicio.toString());
      });

      if (serviceSet.size > 0) {
        const data = calculateMonthlyReportSync({
          user,
          month,
          year,
          startDate,
          endDate,
          daysInMonth,
          assignments: userAssignments,
          replacements: userReplacements,
          siglaMap,
          serviceSet,
          serviceNameMap,
        });

        // Save flags for Replacements purely to fallback if tipo_contrato is missing
        (data as any)._isReplacementOnly =
          userAssignments.filter(
            (a) => a.service?.toString() === serviceId.toString(),
          ).length === 0 &&
          userReplacements.filter(
            (r) => r.servicio?.toString() === serviceId.toString(),
          ).length > 0;

        dataMap.set(userIdStr, data);

        if (ReportSnapshotModel && isClosed) {
          await ReportSnapshotModel.create({
            user_id: user._id,
            period_id: period._id,
            snapshot_data: data as Record<string, unknown>,
            generated_at: new Date(),
          });
        }
      }
    }
  }

  // Ordenar por Nombre Alfabéticamente
  userIdsStr.sort((idA: string, idB: string) => {
    const nameA = dataMap.get(idA)?.user?.nombre || "";
    const nameB = dataMap.get(idB)?.user?.nombre || "";
    return nameA.localeCompare(nameB, "es");
  });

  // Escribir Filas (desde la fila 9)
  let currentRow = 9;
  const daysInMonthTotal = dayjs(endOfMonth).date();

  for (const id of userIdsStr) {
    const data = dataMap.get(id);
    if (!data) continue;

    const row = sheet.getRow(currentRow++);

    const dbUser = userDbMap.get(id);
    let tipoContrato = dbUser?.tipo_contrato || "PLANTA";

    // Fallback if missing
    if (
      (data as any)._isReplacementOnly &&
      (!dbUser?.tipo_contrato || dbUser?.tipo_contrato === "")
    ) {
      tipoContrato = "REEMPLAZO";
    }

    const unassignedDays =
      daysInMonthTotal - (data.totals.daysWorked + data.totals.freeDays);

    row.getCell(1).value = data.user.rut;
    row.getCell(2).value = data.user.nombre;
    row.getCell(3).value = data.user.apellido;
    row.getCell(4).value = data.user.cargo;
    row.getCell(5).value = tipoContrato;
    row.getCell(6).value = data.totals.dayHours;
    row.getCell(7).value = data.totals.nightHours;
    row.getCell(8).value = data.totals.hours;
    row.getCell(9).value = data.totals.daysWorked;
    row.getCell(10).value = data.totals.freeDays;
    row.getCell(11).value = unassignedDays;

    for (let i = 1; i <= 11; i++) {
      const cell = row.getCell(i);
      cell.border = thinBorder;
      cell.alignment = { horizontal: "center", vertical: "bottom" };
      cell.font = { size: 11 };
    }
  }

  if (!isClosed) {
    currentRow += 2;
    sheet.mergeCells(`A${currentRow}:K${currentRow}`);
    const warningRow = sheet.getRow(currentRow);
    warningRow.getCell(1).value =
      "** Esta cartola corresponde a un período en curso. La información puede sufrir modificaciones hasta el cierre mensual **";
    warningRow.getCell(1).font = { bold: true };
    warningRow.getCell(1).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
  }

  return workbook;
};

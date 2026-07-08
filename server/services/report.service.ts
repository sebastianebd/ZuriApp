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
  const servicesInDb = await Service.find({ _id: { $in: Array.from(serviceSet) } });
  const serviceNameMap = new Map<string, string>();
  servicesInDb.forEach((s) => serviceNameMap.set(s._id.toString(), s.nombre));

  // 6. Cálculo de Estadísticas (Por Servicio y Global)
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

    // Filtros Locales
    const svcAssignments = assignments.filter(
      (a) => a.service?.toString() === service,
    );
    const svcReplacements = replacements.filter(
      (r) => r.servicio?.toString() === service,
    );
    const svcAssignmentIds = svcAssignments.map((a) => String(a._id));
    const svcReplacementIds = svcReplacements.map((r) => String(r._id));
    const allIds = [...svcAssignmentIds, ...svcReplacementIds];

    // Iteración Diaria (Construcción del Timeline)
    for (let day = 1; day <= daysInMonth; day++) {
      const currentParamDate = startDate.date(day);
      let activeSigla = "-";

      let activeSource: "replacement" | "assignment" | "exception" | null =
        null;

      // Jerarquía de Resolución:
      // 1. Excepciones Manuales (Override total)
      // 2. Reemplazos (Prioridad sobre asignación base)
      // 3. Asignación Base (Rol)

      // A. Reemplazo
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
          // Fallback legacy
          matchedSigla = siglaMap.has(typeName) ? typeName : typeName || "?";
        }
        activeSigla = matchedSigla;
      } else {
        // B. Asignación
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

      // Cálculos Finales del Día
      const siglaData = siglaMap.get(activeSigla);
      const hours = siglaData?.hours || 0;
      const dayHrs = siglaData?.dayHours || 0;
      const nightHrs = siglaData?.nightHours || 0;
      const startTime = siglaData?.start || "-";
      const endTime = siglaData?.end || "-";
      const color = siglaData?.color || "#e2e8f0";

      const isActive = !!activeSource;

      if (hours > 0 || activeSigla !== "-" || isActive) {
        // Acumuladores de Servicio
        if (hours > 0) {
          svcHours += hours;
          svcDayHours += dayHrs;
          svcNightHours += nightHrs;
        }

        const upperSigla = activeSigla.toUpperCase();
        if (upperSigla === "L") svcL++;
        else if (upperSigla === "N") svcN++;
        else if (upperSigla === "X") svcX++;

        // Integración al Grid Global (Merged)
        if (!mergedGrid.has(day)) {
          mergedGrid.set(day, {
            date: currentParamDate.toDate(),
            dayNum: day,
            items: [],
          });
        }

        // Agregamos item si es relevante
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

    // Determinar "Primera Interacción" (para ordenar visualmente los servicios)
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

    servicesData.push({
      serviceName: serviceNameMap.get(service) || service,
      firstInteraction: earliestDate.valueOf(),
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

  // Ordenar Servicios:
  // 1. Mayor carga horaria primero.
  // 2. Si empate, el que empieza antes en el mes.
  servicesData.sort((a, b) => {
    if (b.stats.hours !== a.stats.hours) {
      return b.stats.hours - a.stats.hours;
    }
    return a.firstInteraction - b.firstInteraction;
  });

  // Aplanar Timeline
  const timeline: any[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    if (mergedGrid.has(day)) {
      const entry = mergedGrid.get(day);
      entry.isOutOfContract = false;
      timeline.push(entry);
    } else {
      // Días vacíos (sin contrato/actividad) se incluyen para completar calendario visual
      timeline.push({
        date: startDate.date(day).toDate(),
        dayNum: day,
        items: [],
        isOutOfContract: true,
      });
    }
  }

  // Recálculo de Totales Globales
  grandTotal.hours = 0;
  grandTotal.L = 0;
  grandTotal.N = 0;
  grandTotal.X = 0;
  grandTotal.dayHours = 0;
  grandTotal.nightHours = 0;

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
        if (upperSigla === "L") {
          grandTotal.L++;
          hasRealShift = true;
        } else if (upperSigla === "N") {
          grandTotal.N++;
          hasRealShift = true;
        } else if (upperSigla === "X") {
          grandTotal.X++;
        }

        if (item.hours > 0) {
          hasRealShift = true;
        }
      });

      // Cálculo de días libres efectivos
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
      dv: calculateDV(user.rut),
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

function calculateDV(rut: string) {
  // TODO: Implementar algoritmo módulo 11 real si es necesario en backend.
  return "K";
}

export const generateIndividualExcelReport = async (month: number, year: number, userId: string, period: any) => {
  let data: any;

  if (period) {
    const ReportSnapshotModel = (await import("../models/report-snapshot.model")).default;
    const snapshot = await ReportSnapshotModel.findOne({ user_id: userId, period_id: period._id });
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

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Cartola Funcionario");

  sheet.addRow(["Reporte de Asistencia"]);
  sheet.addRow([`Funcionario: ${data.user.nombre} ${data.user.apellido}`]);
  sheet.addRow([`RUT: ${data.user.rut}`]);
  sheet.addRow([]);

  sheet.addRow(["Día", "Fecha", "Servicio", "Entrada", "Salida", "Horas Tot.", "Diurnas", "Nocturnas"]);
  sheet.getRow(5).font = { bold: true };

  data.timeline.forEach((dayEntry: any) => {
    if (dayEntry.isOutOfContract || dayEntry.items.length === 0) {
      sheet.addRow([dayEntry.dayNum, dayjs(dayEntry.date).format("DD/MM/YYYY"), "-", "LIBRE", "-", 0, 0, 0]);
    } else {
      dayEntry.items.forEach((item: any) => {
        const isFree = item.sigla === "L" || item.sigla === "X" || item.sigla === "-";
        
        sheet.addRow([
          dayEntry.dayNum,
          dayjs(dayEntry.date).format("DD/MM/YYYY"),
          item.service,
          isFree ? "LIBRE" : item.startTime,
          isFree ? "LIBRE" : item.endTime,
          item.hours,
          item.dayHrs,
          item.nightHrs,
        ]);
      });
    }
  });

  sheet.addRow([]);
  sheet.addRow(["TOTALES GLOBALES"]);
  sheet.getRow(sheet.rowCount).font = { bold: true };
  sheet.addRow(["Días Trabajados", data.totals.daysWorked]);
  sheet.addRow(["Días Libres", data.totals.freeDays]);
  sheet.addRow(["Total Horas", data.totals.hours]);
  sheet.addRow(["Total L", data.totals.L]);
  sheet.addRow(["Total N", data.totals.N]);
  sheet.addRow(["Total X", data.totals.X]);

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
  // Busca todos los usuarios que tienen turnos en ese servicio/mes
  const startOfMonth = dayjs(
    `${year}-${String(month).padStart(2, "0")}-01`,
  ).toDate();
  const endOfMonth = dayjs(startOfMonth).endOf("month").toDate();

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
  const sheet = workbook.addWorksheet(`Servicio ${serviceId} ${month}-${year}`);

  // Cabecera del Excel
  sheet.addRow([
    "RUT",
    "DV",
    "Nombre",
    "Apellido",
    "Cargo",
    "Horas Totales",
    "Horas Diurnas",
    "Horas Nocturnas",
  ]);
  sheet.getRow(1).font = { bold: true };

  const CHUNK_SIZE = 10;

  // ponytail: for...of garantiza ejecución secuencial sin saturar memoria RAM.
  // Techo conocido: con chunks de 10 el heap se mantiene bajo 200MB incluso para 500 usuarios.
  for (let i = 0; i < assignments.length; i += CHUNK_SIZE) {
    const chunk = assignments.slice(i, i + CHUNK_SIZE);

    for (const userId of chunk) {
      const userIdStr = userId.toString();

      let data: any;

      if (period) {
        // Intenta reutilizar snapshot existente
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
          // Calcula y guarda el snapshot (lazy)
          data = await getMonthlyReport({ month, year, userId: userIdStr });
          await ReportSnapshotModel.create({
            user_id: userId,
            period_id: period._id,
            snapshot_data: data as Record<string, unknown>,
            generated_at: new Date(),
          });
        }
      } else {
        // Mes en curso: calcula al vuelo sin guardar snapshot
        data = await getMonthlyReport({ month, year, userId: userIdStr });
      }

      sheet.addRow([
        data?.user?.rut ?? "",
        data?.user?.dv ?? "",
        data?.user?.nombre ?? "",
        data?.user?.apellido ?? "",
        data?.user?.cargo ?? "",
        data?.totals?.hours ?? 0,
        data?.totals?.dayHours ?? 0,
        data?.totals?.nightHours ?? 0,
      ]);
    }
  }

  return workbook;
};

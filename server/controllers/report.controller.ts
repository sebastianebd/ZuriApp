import { Request, Response, NextFunction } from "express";
import * as ReportService from "../services/report.service";

export const getMonthlySummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { month, year, userId } = req.query;

    if (!month || !year || !userId) {
      return res
        .status(400)
        .json({ error: "Missing required parameters: month, year, userId" });
    }

    // Regla de Negocio: Integridad de Reportes
    // No permitimos generar reportes de meses no cerrados (futuro o mes en curso)
    // para evitar inconsistencias en pagos/auditorías de RRHH, salvo que sea una 'preview' explícita.
    const isPreview = req.query.preview === "true";
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    const reqMonth = Number(month);
    const reqYear = Number(year);

    if (
      !isPreview &&
      (reqYear > currentYear ||
        (reqYear === currentYear && reqMonth >= currentMonth))
    ) {
      return res.status(400).json({
        error:
          "No se puede generar el reporte del mes en curso o futuro. Espere al cierre del mes.",
      });
    }

    console.log(
      `[ReportController] Requesting statement for: User="${userId}", Month=${month}, Year=${year}`,
    );

    const data = await ReportService.getMonthlyReport({
      month: Number(month),
      year: Number(year),
      userId: String(userId),
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const exportExcel = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { month, year, userId } = req.query;

    if (!month || !year || !userId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Validación de Tiempo (Misma regla que en Summary)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    const reqMonth = Number(month);
    const reqYear = Number(year);

    if (
      reqYear > currentYear ||
      (reqYear === currentYear && reqMonth >= currentMonth)
    ) {
      return res.status(400).json({
        error:
          "No se puede generar el reporte del mes en curso o futuro. Espere al cierre del mes.",
      });
    }

    const data = await ReportService.getMonthlyReport({
      month: Number(month),
      year: Number(year),
      userId: String(userId),
    });

    // Generación de Excel vía Streaming
    // Se escribe directamente al stream de respuesta (res) para minimizar uso de memoria RAM
    // en reportes grandes.
    const workbook = await ReportService.generateExcelReport(data, {
      month: Number(month),
      year: Number(year),
      userId: String(userId),
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Reporte_Funcionario_${userId}_${month}_${year}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

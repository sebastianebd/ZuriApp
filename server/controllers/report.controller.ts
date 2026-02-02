import { Request, Response, NextFunction } from "express";
import * as ReportService from "../services/report.service";

export const getMonthlySummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { month, year, userId } = req.query;

    // Validation
    if (!month || !year || !userId) {
      return res
        .status(400)
        .json({ error: "Missing required parameters: month, year, userId" });
    }

    // [New] Validate that we are not generating a report for the current (ongoing) month or future
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

    // [New] Validate that we are not generating a report for the current (ongoing) month or future
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

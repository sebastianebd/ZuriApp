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

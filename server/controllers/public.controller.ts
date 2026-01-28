import { Request, Response } from "express";
import * as ReportService from "../services/report.service";

export const getPublicUserShifts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    let { month, year } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Default to current date if not provided
    const now = new Date();
    if (!month) month = (now.getMonth() + 1).toString();
    if (!year) year = now.getFullYear().toString();

    // Fetch Report Data
    try {
      const data = await ReportService.getMonthlyReport({
        month: Number(month),
        year: Number(year),
        userId: String(userId),
      });

      // The report service returns 'timeline' which contains day-by-day info
      // We return the raw report structure, frontend will map it to events
      return res.json({
        user: data.user,
        timeline: data.timeline,
        metadata: data.metadata,
      });
    } catch (svcError: any) {
      // If 404 (No data), return empty timeline instead of crash
      if (
        svcError.status === 404 ||
        (svcError.message && svcError.message.includes("No se encontraron"))
      ) {
        return res.json({
          user: null,
          timeline: [],
          metadata: { month, year },
        });
      }
      throw svcError;
    }
  } catch (error) {
    console.error("Error fetching public shifts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

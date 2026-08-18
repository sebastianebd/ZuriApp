import * as ReportService from "./report.service";

/**
 * Servicio para gestionar las integraciones y vistas públicas.
 */

async function getPublicUserShifts(userId: string, monthStr?: string, yearStr?: string) {
  const now = new Date();
  const month = monthStr ? Number(monthStr) : now.getMonth() + 1;
  const year = yearStr ? Number(yearStr) : now.getFullYear();

  try {
    const data = await ReportService.getMonthlyReport({
      month,
      year,
      staffId: userId,
    });

    return {
      user: data.staff,
      timeline: data.timeline,
      metadata: data.metadata,
    };
  } catch (svcError: any) {
    if (
      svcError.status === 404 ||
      (svcError.message && svcError.message.includes("No se encontraron"))
    ) {
      return {
        user: null,
        timeline: [],
        metadata: { month, year },
      };
    }
    throw svcError;
  }
}

export default {
  getPublicUserShifts,
};

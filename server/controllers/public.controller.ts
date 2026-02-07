import { Request, Response } from "express";
import * as ReportService from "../services/report.service";

export const getPublicUserShifts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    let { month, year } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Default: Mes actual si no se especifica
    const now = new Date();
    if (!month) month = (now.getMonth() + 1).toString();
    if (!year) year = now.getFullYear().toString();

    // Obtención de Datos
    // Reutilizamos la lógica del servicio de reportes para garantizar consistencia
    // entre la vista privada del funcionario y esta vista pública compartible.
    try {
      const data = await ReportService.getMonthlyReport({
        month: Number(month),
        year: Number(year),
        userId: String(userId),
      });

      // Transformación de Respuesta
      // Retornamos la estructura cruda; el frontend público se encarga de renderizar
      // una vista simplificada (solo lectura) de los turnos.
      return res.json({
        user: data.user,
        timeline: data.timeline,
        metadata: data.metadata,
      });
    } catch (svcError: any) {
      // Manejo de 'No Encontrado' (404)
      // En lugar de error, retornamos timeline vacío para una UI más amigable.
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

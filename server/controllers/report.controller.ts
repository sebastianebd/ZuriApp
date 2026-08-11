import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import * as ReportService from "../services/report.service";
import * as ExcelReportService from "../services/excel-report.service";
import { getSignedDownloadUrl } from "../config/s3.client";

/**
 * Lazy Evaluation: Si el mes está CLOSED, devuelve el Snapshot guardado (o lo crea).
 * Si el mes está abierto, calcula en tiempo real.
 * Dominio: sin excepciones, sin reaperturas. El período cerrado es inmutable.
 */
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
        .json({ message: "Missing required parameters: month, year, userId" });
    }

    const reqMonth = Number(month);
    const reqYear = Number(year);
    const userIdStr = String(userId);

    const data = await ReportService.getMonthlySummaryWithSnapshot(reqMonth, reqYear, userIdStr);
    res.json(data);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al obtener reporte", error });
  }
};

/**
 * Exportación de Excel por Servicio con Chunking (protección de memoria).
 * Procesa usuarios en lotes de 10 para mantener RAM plana y estable.
 */
export const exportExcelByService = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { month, year, serviceId } = req.query;

    if (!month || !year || !serviceId) {
      return res
        .status(400)
        .json({ message: "Missing required parameters: month, year, serviceId" });
    }

    const reqMonth = Number(month);
    const reqYear = Number(year);

    const period = await ReportService.getPeriod(reqMonth, reqYear);

    // Si el período está cerrado, usa Snapshots; si está abierto, calcula al vuelo
    const workbook = await ExcelReportService.generateServiceExcelReport({
      month: reqMonth,
      year: reqYear,
      serviceId: String(serviceId),
      period,
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Reporte_Servicio_${serviceId}_${month}_${year}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al exportar reporte", error });
  }
};

/**
 * Exportación de Excel Individual (Cartola)
 * Permite descargar la cartola tanto de mes abierto como cerrado.
 */
export const exportIndividualExcel = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { month, year, userId } = req.query;

    if (!month || !year || !userId) {
      return res
        .status(400)
        .json({ message: "Missing required parameters: month, year, userId" });
    }

    const reqMonth = Number(month);
    const reqYear = Number(year);
    const userIdStr = String(userId);

    const period = await ReportService.getPeriod(reqMonth, reqYear);

    const workbook = await ExcelReportService.generateIndividualExcelReport(
      reqMonth,
      reqYear,
      userIdStr,
      period,
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Cartola_${userIdStr}_${month}_${year}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al exportar cartola", error });
  }
};

/**
 * Devuelve una URL firmada S3 (5 min) para descargar el PDF oficial de un servicio.
 * Solo disponible en períodos cerrados (la URL del PDF fue generada por el Worker).
 */
export const getServicePDFUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { month, year, serviceId } = req.query;

    if (!month || !year || !serviceId) {
      return res
        .status(400)
        .json({ message: "Missing required parameters: month, year, serviceId" });
    }

    const period = await ReportService.getPeriod(Number(month), Number(year));

    if (!period || period.status !== "CLOSED") {
      return res.status(400).json({
        message: "El PDF oficial solo está disponible para períodos cerrados.",
      });
    }

    // Obtener la clave S3 del PDF generado por el Worker
    const s3Key = (period as any).pdfUrls?.get?.(String(serviceId));
    if (!s3Key) {
      return res.status(404).json({
        message: "PDF no encontrado para este servicio.",
      });
    }

    const signedUrl = await getSignedDownloadUrl(s3Key, 300);
    res.json({ signedUrl });
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ message: error.message || "Error al obtener pdf", error });
  }
};

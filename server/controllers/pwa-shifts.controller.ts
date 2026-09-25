import { Request, Response, NextFunction } from 'express';
import PwaShiftsService from '../services/pwa-shifts.service';
import PwaReportService from '../services/pwa-report.service';

export const getHomeSummaryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const staffId = (req as any).staff._id.toString();
    const data = await PwaShiftsService.getHomeSummary(staffId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getShiftsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const staffId = (req as any).staff._id.toString();
    const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    const data = await PwaShiftsService.getShifts(staffId, month, year);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const confirmShiftHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const staffId = (req as any).staff._id.toString();
    const assignmentId = req.params.id;
    const { assignmentModel, date } = req.body;

    const result = await PwaShiftsService.confirmShift(
      staffId,
      assignmentId,
      assignmentModel,
      date
    );
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const reportUnavailableHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const staffId = (req as any).staff._id.toString();
    const assignmentId = req.params.id;
    const { assignmentModel, date, reason } = req.body;

    const result = await PwaShiftsService.reportUnavailable(
      staffId,
      assignmentId,
      assignmentModel,
      date,
      reason
    );
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getAdvanceReportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const staffId = (req as any).staff._id.toString();
    const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    const pdfBuffer = await PwaReportService.generateAdvancePDF(staffId, month, year);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="avance_mes_${year}_${month}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const getCartolaReportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const staffId = (req as any).staff._id.toString();
    const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    const pdfBuffer = await PwaReportService.generateCartolaPDF(staffId, month, year);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="cartola_${year}_${month}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const getReplacementVoucherHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const staffId = (req as any).staff._id.toString();
    const replacementId = req.params.id;

    const pdfBuffer = await PwaReportService.generateVoucherPDF(replacementId, staffId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="comprobante_reemplazo_${replacementId}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const updatePreferencesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const staffId = (req as any).staff._id.toString();
    const result = await PwaShiftsService.updatePreferences(staffId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default {
  getHomeSummaryHandler,
  getShiftsHandler,
  confirmShiftHandler,
  reportUnavailableHandler,
  getAdvanceReportHandler,
  getCartolaReportHandler,
  getReplacementVoucherHandler,
  updatePreferencesHandler,
};

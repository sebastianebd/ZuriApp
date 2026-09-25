import { Request, Response, NextFunction } from 'express';
import ReplacementOfferService from '../services/replacement-offer.service';
import AvailabilityService from '../services/availability.service';
import ReplacementOffer from '../models/replacement-offer.model';

export const createOfferHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const creatorStaffId = (req as any).staff?._id?.toString() || (req as any).staff?.id;
    const result = await ReplacementOfferService.createOffer(req.body, creatorStaffId);
    return res.status(201).json({
      success: true,
      message: 'Convocatoria de reemplazo creada exitosamente',
      data: result,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getOffersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { serviceId, status } = req.query;
    const data = await ReplacementOfferService.getOffers({
      serviceId: serviceId ? String(serviceId) : undefined,
      status: status ? String(status) : undefined,
    });
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    next(error);
  }
};

export const cancelOfferHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const staffId = (req as any).staff?._id?.toString();
    const result = await ReplacementOfferService.cancelOffer(
      req.params.id,
      staffId,
      req.body?.reason
    );
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const awardOfferHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const awardedBy = (req as any).staff?._id?.toString();
    const { targetStaffId } = req.body;
    const result = await ReplacementOfferService.awardOffer(
      req.params.id,
      targetStaffId,
      awardedBy
    );
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getOpenOffersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const staffId = (req as any).staff?._id?.toString();
    const data = await ReplacementOfferService.getOpenOffersForHonorario(staffId);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getMyApplicationsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const staffId = (req as any).staff?._id?.toString();
    const data = await ReplacementOfferService.getMyApplications(staffId);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    next(error);
  }
};

export const applyOfferHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const staffId = (req as any).staff?._id?.toString();
    const result = await ReplacementOfferService.applyToOffer(req.params.id, staffId);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const withdrawOfferHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const staffId = (req as any).staff?._id?.toString();
    const result = await ReplacementOfferService.withdrawApplication(
      req.params.id,
      staffId
    );
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getOfferScoringHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const offerId = req.params.id;
    const offer = await ReplacementOffer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Convocatoria no encontrada' });
    }

    const hasApplicants =
      offer.applicants &&
      offer.applicants.some(
        (a: any) => a.status === 'pending' || a.status === 'selected'
      );

    let candidates: any[] = [];
    let isCallList = false;

    if (hasApplicants) {
      candidates = await AvailabilityService.scoreOfferApplicants(offerId);
    } else {
      isCallList = true;
      const srvId =
        (offer.serviceId as any)?._id?.toString() || offer.serviceId?.toString();
      const posId =
        (offer.positionId as any)?._id?.toString() || offer.positionId?.toString();
      candidates = await AvailabilityService.getTopEligibleCandidates(
        srvId,
        posId,
        offer.fecha_inicio,
        offer.fecha_termino
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        offerId,
        isCallList,
        candidates,
      },
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

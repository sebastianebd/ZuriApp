import { Request, Response } from 'express';
import logger from '../config/logger.config';
import positionService from '../services/position.service';

export const getPositions = async (req: Request, res: Response) => {
  try {
    const positions = await positionService.getPositions();
    res.status(200).json(positions);
  } catch (error: any) {
    logger.error(`Error in getPositions: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

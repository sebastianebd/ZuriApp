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

export const createPosition = async (req: Request, res: Response) => {
  try {
    const { name, position_code, description, isActive } = req.body;
    const position = await positionService.createPosition({ name, position_code, description, isActive });
    res.status(201).json(position);
  } catch (error: any) {
    logger.error(`Error in createPosition: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const updatePosition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, position_code, description, isActive } = req.body;
    const position = await positionService.updatePosition(id, { name, position_code, description, isActive });
    res.status(200).json(position);
  } catch (error: any) {
    logger.error(`Error in updatePosition: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const deletePosition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const position = await positionService.deletePosition(id);
    res.status(200).json({ success: true, position });
  } catch (error: any) {
    logger.error(`Error in deletePosition: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

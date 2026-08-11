import { Request, Response } from "express";
import shiftExceptionService from "../services/shift-exception.service";

export const createException = async (req: Request, res: Response) => {
  try {
    const exception = await shiftExceptionService.createException(req.body, (req as any).account);
    res.json(exception);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error creating/updating exception", error });
  }
};

export const getExceptions = async (req: Request, res: Response) => {
  try {
    const exceptions = await shiftExceptionService.getExceptions(req.query);
    res.json(exceptions);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error fetching exceptions", error });
  }
};

export const getExceptionById = async (req: Request, res: Response) => {
  try {
    const exception = await shiftExceptionService.getExceptionById(req.params.id);
    res.json(exception);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error fetching exception", error });
  }
};

export const deleteException = async (req: Request, res: Response) => {
  try {
    await shiftExceptionService.deleteException(req.params.id, (req as any).account);
    res.json({ message: "Exception deleted successfully" });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Error deleting exception", error });
  }
};


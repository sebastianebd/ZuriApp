import { Request, Response } from "express";
import publicService from "../services/public.service";

export const getPublicUserShifts = async (req: Request, res: Response) => {
  try {
    const { userId, month, year } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const data = await publicService.getPublicUserShifts(
      String(userId),
      month ? String(month) : undefined,
      year ? String(year) : undefined
    );

    return res.json(data);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Internal Server Error", error });
  }
};


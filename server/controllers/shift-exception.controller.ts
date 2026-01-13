import { Request, Response } from "express";
import { ShiftExceptionModel } from "../models/shift-exception.model";

export const createException = async (req: Request, res: Response) => {
  try {
    const { assignment_id, date, override_type, reason, created_by } = req.body;

    // Use findOneAndUpdate with upsert to update existing or create new
    const exception = await ShiftExceptionModel.findOneAndUpdate(
      { assignment_id, date: new Date(date) },
      { override_type, reason, created_by, created_at: new Date() },
      { upsert: true, new: true }
    ).populate("assignment_id", "user_id turn_type");

    res.json(exception);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error creating/updating exception", error });
  }
};

export const getExceptions = async (req: Request, res: Response) => {
  try {
    const { assignment_id, start_date, end_date } = req.query;

    const query: any = {};
    if (assignment_id) query.assignment_id = assignment_id;
    if (start_date && end_date) {
      // Adjust end_date to include the entire day (23:59:59)
      const endDateTime = new Date(end_date as string);
      endDateTime.setHours(23, 59, 59, 999);

      query.date = {
        $gte: new Date(start_date as string),
        $lte: endDateTime,
      };
    }

    const exceptions = await ShiftExceptionModel.find(query)
      .populate({
        path: "assignment_id",
        select: "user_id turn_type service",
        populate: {
          path: "user_id",
          select: "nombre apellido servicio tipo_cargo",
        },
      })
      .populate("created_by", "nombre apellido")
      .sort({ date: 1 });

    res.json(exceptions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching exceptions", error });
  }
};

export const getExceptionById = async (req: Request, res: Response) => {
  try {
    const exception = await ShiftExceptionModel.findById(req.params.id)
      .populate("assignment_id")
      .populate("created_by", "nombre apellido");

    if (!exception) {
      return res.status(404).json({ message: "Exception not found" });
    }
    res.json(exception);
  } catch (error) {
    res.status(500).json({ message: "Error fetching exception", error });
  }
};

export const deleteException = async (req: Request, res: Response) => {
  try {
    const exception = await ShiftExceptionModel.findByIdAndDelete(
      req.params.id
    );

    if (!exception) {
      return res.status(404).json({ message: "Exception not found" });
    }
    res.json({ message: "Exception deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting exception", error });
  }
};

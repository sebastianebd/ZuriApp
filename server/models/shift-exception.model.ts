import { Schema, model, Document } from "mongoose";

export interface IShiftException extends Document {
  assignment_id: Schema.Types.ObjectId;
  date: Date;
  original_type: "LARGO" | "NOCHE" | "LIBRE";
  override_type: "LARGO" | "NOCHE" | "LIBRE";
  reason?: string;
  created_by: Schema.Types.ObjectId;
  created_at: Date;
}

const shiftExceptionSchema = new Schema<IShiftException>(
  {
    assignment_id: {
      type: Schema.Types.ObjectId,
      ref: "TurnAssignment",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    original_type: {
      type: String,
      enum: ["LARGO", "NOCHE", "LIBRE"],
      required: true,
    },
    override_type: {
      type: String,
      enum: ["LARGO", "NOCHE", "LIBRE"],
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient queries
shiftExceptionSchema.index({ assignment_id: 1, date: 1 }, { unique: true });

export const ShiftExceptionModel = model<IShiftException>(
  "ShiftException",
  shiftExceptionSchema
);

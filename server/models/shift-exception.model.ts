import { Schema, model, Document } from "mongoose";

export interface IShiftException extends Document {
  assignment_id: Schema.Types.ObjectId;
  assignment_model: "TurnAssignment" | "Replacement";
  date: Date;
  original_type: string;
  override_type: string;
  reason?: string;
  created_by: Schema.Types.ObjectId;
  created_at: Date;
}

const shiftExceptionSchema = new Schema<IShiftException>(
  {
    assignment_id: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "assignment_model", // Polymorphic reference
      index: true,
    },
    assignment_model: {
      type: String,
      required: true,
      enum: ["TurnAssignment", "Replacement"],
      default: "TurnAssignment",
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    original_type: {
      type: String,
      required: true,
    },
    override_type: {
      type: String,
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
  },
);

// Compound index for efficient queries
shiftExceptionSchema.index({ assignment_id: 1, date: 1 }, { unique: true });

export const ShiftExceptionModel = model<IShiftException>(
  "ShiftException",
  shiftExceptionSchema,
);

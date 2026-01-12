import mongoose, { Schema, Document } from "mongoose";

export interface ITurnAssignment extends Document {
  user_id: mongoose.Types.ObjectId;
  service: string;
  turn_type: string;
  start_date: Date;
  end_date?: Date;
}

const turnAssignmentSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service: {
      type: String,
      required: true, // Making it required as per user implication
    },
    turn_type: {
      type: String,
      required: true,
      trim: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const TurnAssignmentModel = mongoose.model<ITurnAssignment>(
  "TurnAssignment",
  turnAssignmentSchema
);

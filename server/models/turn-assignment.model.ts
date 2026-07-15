import mongoose, { Schema, Document } from "mongoose";

export interface ITurnAssignment extends Document {
  user_id: mongoose.Types.ObjectId;
  service: mongoose.Types.ObjectId;
  turn_type: string;
  start_date: Date;
  end_date?: Date;
  snapshot_secuencia?: Array<{
    dia: number;
    turno_entrada?: string;
    turno_salida?: string;
    es_libre: boolean;
    sigla: string;
    color?: string;
  }>;
}

const turnAssignmentSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    turn_type: {
      type: Schema.Types.ObjectId,
      ref: "TurnType",
      required: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
    },
    snapshot_secuencia: [
      {
        dia: { type: Number, required: true },
        turno_entrada: { type: String, default: null },
        turno_salida: { type: String, default: null },
        es_libre: { type: Boolean, default: false },
        sigla: { type: String, required: true },
        color: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const TurnAssignmentModel = mongoose.model<ITurnAssignment>(
  "TurnAssignment",
  turnAssignmentSchema,
);

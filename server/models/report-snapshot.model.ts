import mongoose, { Schema, Document } from "mongoose";

export interface IReportSnapshot extends Document {
  user_id: mongoose.Types.ObjectId;
  period_id: mongoose.Types.ObjectId;
  snapshot_data: Record<string, unknown>; // Tipado estricto — no 'any'
  generated_at: Date;
}

const ReportSnapshotSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    period_id: { type: Schema.Types.ObjectId, ref: "Period", required: true },
    snapshot_data: { type: Schema.Types.Mixed, required: true },
    generated_at: { type: Date, default: () => new Date() },
  },
  { timestamps: false, versionKey: false },
);

// Lookup rápido: un snapshot por usuario por período
ReportSnapshotSchema.index({ user_id: 1, period_id: 1 }, { unique: true });

export default mongoose.model<IReportSnapshot>(
  "ReportSnapshot",
  ReportSnapshotSchema,
);

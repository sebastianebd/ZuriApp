import mongoose, { Schema, Document } from "mongoose";

export interface IPeriod extends Document {
  month: number; // 1-12
  year: number;
  status: "OPEN" | "CLOSED";
  closedAt?: Date;
  closedBy?: mongoose.Types.ObjectId;
  // Mapa serviceId → S3 key del PDF generado por el Worker en el cierre mensual
  pdfUrls: Map<string, string>;
}

const PeriodSchema = new Schema(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    status: { type: String, enum: ["OPEN", "CLOSED"], default: "OPEN" },
    closedAt: { type: Date },
    closedBy: { type: Schema.Types.ObjectId, ref: "Staff" },
    // Non-breaking: campo nuevo con default vacío
    pdfUrls: { type: Map, of: String, default: () => new Map() },
  },
  { timestamps: true, versionKey: false },
);

// Garantiza unicidad por mes/año — un único registro gobierna el estado del período
PeriodSchema.index({ month: 1, year: 1 }, { unique: true });

export default mongoose.model<IPeriod>("Period", PeriodSchema);


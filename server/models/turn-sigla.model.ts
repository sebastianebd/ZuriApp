import { Schema, model, Document } from "mongoose";

export interface ITurnSigla extends Document {
  sigla: string; // e.g., 'L', 'N', 'X'
  nombre: string; // e.g., 'Largo', 'Noche', 'Libre'
  descripcion?: string;
  color: string; // Hex color
  turno_entrada?: string; // HH:mm
  turno_salida?: string; // HH:mm
  activo: boolean;
  deleted_at?: Date;
}

const TurnSiglaSchema = new Schema<ITurnSigla>(
  {
    sigla: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 5,
    },
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true },
    color: {
      type: String,
      required: true,
      match: /^#([0-9A-F]{3}){1,2}$/i,
      default: "#e2e8f0",
    },
    turno_entrada: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    turno_salida: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    activo: { type: Boolean, default: true },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Enterprise Soft Delete: Unique ONLY when active (deleted_at is null)
TurnSiglaSchema.index(
  { sigla: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
);

export const TurnSigla = model<ITurnSigla>("TurnSigla", TurnSiglaSchema);

export const TURN_SIGLA_AUDIT_FIELDS = [
  "sigla",
  "turno_entrada",
  "turno_salida",
  "color",
  "nombre",
  "activo",
];

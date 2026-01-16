import { Schema, model, Document } from "mongoose";

export interface ITurnSigla extends Document {
  sigla: string; // e.g., 'L', 'N', 'X'
  nombre: string; // e.g., 'Largo', 'Noche', 'Libre'
  descripcion?: string;
  color: string; // Hex color
  turno_entrada?: string; // HH:mm
  turno_salida?: string; // HH:mm
  activo: boolean;
}

const TurnSiglaSchema = new Schema<ITurnSigla>(
  {
    sigla: {
      type: String,
      required: true,
      unique: true,
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const TurnSigla = model<ITurnSigla>("TurnSigla", TurnSiglaSchema);

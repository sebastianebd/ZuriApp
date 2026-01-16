import mongoose, { Document, Schema } from "mongoose";

export interface ITurnType extends Document {
  nombre: string;
  codigo: string;
  alias?: string;
  jornada?: string; // 'DIURNO' | 'NOCTURNO' | 'MIXTO'
  descripcion?: string;
  cantidad_dias: number;
  secuencia: Array<{
    dia: number;
    turno_entrada?: string;
    turno_salida?: string;
    es_libre: boolean;
    sigla: string;
  }>;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  deleted_at?: Date;
}

const TurnTypeSchema: Schema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    codigo: {
      type: String,
      uppercase: true,
      trim: true,
    },
    alias: {
      type: String,
      trim: true,
      uppercase: true,
    },
    jornada: {
      type: String,
      enum: ["DIURNO", "NOCTURNO", "MIXTO"],
      default: "MIXTO",
      uppercase: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    cantidad_dias: {
      type: Number,
      required: true,
      default: 7,
    },
    secuencia: [
      {
        dia: { type: Number, required: true },
        turno_entrada: { type: String, default: null }, // HH:mm
        turno_salida: { type: String, default: null }, // HH:mm
        es_libre: { type: Boolean, default: false },
        sigla: { type: String, required: true, uppercase: true, trim: true },
        color: { type: String, default: "#e2e8f0", trim: true },
      },
    ],
    activo: {
      type: Boolean,
      default: true,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Enterprise Soft Delete: Unique ONLY when active (deleted_at is null)
TurnTypeSchema.index(
  { nombre: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
);
TurnTypeSchema.index(
  { codigo: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
);

export default mongoose.model<ITurnType>("TurnType", TurnTypeSchema);

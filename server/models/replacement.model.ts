import mongoose, { Schema, Document } from "mongoose";
import Counter from "./counter.model";

export interface IReplacement extends Document {
  id_negocio?: string;
  id_saliente: mongoose.Types.ObjectId;
  rut_saliente: string;
  nombre_saliente: string;
  apellido_saliente: string;
  id_entrante: mongoose.Types.ObjectId;
  rut_entrante: string;
  nombre_entrante: string;
  apellido_entrante: string;
  tipo_turno: string;
  turn_type_id?: mongoose.Types.ObjectId;
  fecha_inicio: Date;
  fecha_termino: Date;
  servicio: mongoose.Types.ObjectId;
  snapshot_secuencia?: Array<{
    dia: number;
    turno_entrada?: string;
    turno_salida?: string;
    es_libre: boolean;
    sigla: string;
  }>;
  status: string;
  creado_por: mongoose.Types.ObjectId;
  corte_anticipado: boolean;
  created_at: Date;
  updated_at: Date;
}

const replacementSchema: Schema = new Schema(
  {
    id_negocio: {
      type: String,
      uppercase: true,
    },
    id_saliente: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    rut_saliente: {
      type: String,
      required: true,
      uppercase: true,
    },
    nombre_saliente: {
      type: String,
      required: true,
      uppercase: true,
    },
    apellido_saliente: {
      type: String,
      required: true,
      uppercase: true,
    },
    id_entrante: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      index: true,
    },
    rut_entrante: {
      type: String,
      required: true,
      uppercase: true,
    },
    nombre_entrante: {
      type: String,
      required: true,
      uppercase: true,
    },
    apellido_entrante: {
      type: String,
      required: true,
      uppercase: true,
    },
    tipo_turno: {
      type: String,
      required: true,
      uppercase: true,
    },
    turn_type_id: {
      type: Schema.Types.ObjectId,
      ref: "TurnType",
      required: false, // Optional temporarily/refactor
    },
    fecha_inicio: {
      type: Date,
      required: true,
    },
    fecha_termino: {
      type: Date,
      required: true,
    },
    servicio: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    snapshot_secuencia: [
      {
        dia: { type: Number, required: true },
        turno_entrada: { type: String, default: null },
        turno_salida: { type: String, default: null },
        es_libre: { type: Boolean, default: false },
        sigla: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: [
        "PENDIENTE",
        "CONFIRMADO",
        "RECHAZADO",
        "CANCELADO",
        "FINALIZADO",
        "EN CURSO",
        "INTERRUMPIDO",
      ],
      default: "PENDIENTE",
    },
    creado_por: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    corte_anticipado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

// Pre-save hook for Counter
replacementSchema.pre<IReplacement>("save", async function (next) {
  if (!this.id_negocio) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "replacementId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      this.id_negocio = `RPL-${counter.seq}`;
      console.log(`Generated ID for replacement: ${this.id_negocio}`);
      next();
    } catch (error: any) {
      console.error("Error generating counter:", error);
      next(error);
    }
  } else {
    next();
  }
});

export default mongoose.model<IReplacement>(
  "Replacement",
  replacementSchema,
  "replacements",
);

export const REPLACEMENT_AUDIT_FIELDS = [
  "rut_saliente",
  "nombre_saliente",
  "apellido_saliente",
  "rut_entrante",
  "nombre_entrante",
  "apellido_entrante",
  "tipo_turno",
  "fecha_inicio",
  "fecha_termino",
  "servicio",
  "status",
  "corte_anticipado",
];

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
  servicio: string;
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
      ref: "User",
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
      ref: "User",
      required: true,
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
      type: String,
      required: true,
      uppercase: true,
    },
    status: {
      type: String,
      default: "PENDIENTE",
      uppercase: true,
    },
    creado_por: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    corte_anticipado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance optimization
replacementSchema.index({ status: 1, fecha_inicio: -1 }); // Critical for History view: Filter by status + Sort by date
replacementSchema.index({ servicio: 1 });
replacementSchema.index({ rut_saliente: 1 });
replacementSchema.index({ rut_entrante: 1 });
replacementSchema.index({ id_negocio: 1 }); // Optimize lookups by replacement ID

replacementSchema.virtual("id").get(function (this: any) {
  return this._id.toHexString();
});

replacementSchema.pre("save", async function (next) {
  const doc = this as any; // Cast to access custom properties including id_negocio which might not be on strict Document type in pre hooks easily
  if (doc.id_negocio) return next();

  try {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const prefix = "RP";
    const counterId = `replacementId_${currentYear}`;

    let counter = await Counter.findOneAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { new: true },
    );

    if (!counter) {
      await Counter.create({ _id: counterId });
      counter = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { new: true },
      );
    }

    if (!counter) throw new Error("Could not create/update counter");

    const nuevoNumero = counter.seq;
    doc.id_negocio = `${prefix}${currentYear}${nuevoNumero}`;
    next();
  } catch (error) {
    next(error as any);
  }
});

export default mongoose.model<IReplacement>("Replacement", replacementSchema);

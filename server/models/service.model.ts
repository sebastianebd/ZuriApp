import mongoose, { Document, Schema } from "mongoose";

export interface IService extends Document {
  nombre: string;
  codigo: string;
  jefe_medico?: mongoose.Types.ObjectId;
  enfermero_coordinador?: mongoose.Types.ObjectId;
  centro_costo?: string;
  ubicacion?: string;
  anexo?: string;
  email?: string;
  activo: boolean; // For soft delete or deactivation
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    codigo: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    jefe_medico: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    enfermero_coordinador: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    centro_costo: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allow multiple nulls/undefined but unique if set
    },
    ubicacion: {
      type: String,
      trim: true,
    },
    anexo: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model<IService>("Service", ServiceSchema);

import mongoose, { Document, Schema } from "mongoose";

export interface IService extends Document {
  nombre: string;
  codigo: string;
  jefe_servicio?: mongoose.Types.ObjectId;
  supervisor?: mongoose.Types.ObjectId;
  coordinadores?: mongoose.Types.ObjectId[];
  jefes_turno?: mongoose.Types.ObjectId[];
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
    jefe_servicio: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    supervisor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    coordinadores: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    jefes_turno: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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

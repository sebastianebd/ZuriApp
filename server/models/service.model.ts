import mongoose, { Document, Schema } from "mongoose";

export interface IDotacionMinima {
  positionId: mongoose.Types.ObjectId;
  minimo_dia: number;
  minimo_noche: number;
}

export interface IUmbralesCobertura {
  verde: number;
  amarillo: number;
}

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
  dotacion_minima?: IDotacionMinima[];
  umbrales_cobertura?: IUmbralesCobertura;
  activo: boolean; // Status
  deleted_at?: Date; // Soft Delete
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
      ref: "Staff",
      default: null,
    },
    supervisor: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    coordinadores: [
      {
        type: Schema.Types.ObjectId,
        ref: "Staff",
      },
    ],
    jefes_turno: [
      {
        type: Schema.Types.ObjectId,
        ref: "Staff",
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
    dotacion_minima: [
      {
        positionId: {
          type: Schema.Types.ObjectId,
          ref: "Position",
          required: true,
        },
        minimo_dia: {
          type: Number,
          required: true,
          default: 0,
        },
        minimo_noche: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
    umbrales_cobertura: {
      verde: {
        type: Number,
        default: 95,
      },
      amarillo: {
        type: Number,
        default: 85,
      },
    },
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

export default mongoose.model<IService>("Service", ServiceSchema);

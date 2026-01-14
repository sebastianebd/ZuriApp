import mongoose, { Schema, Document } from "mongoose";

export interface ICargo extends Document {
  nombre: string;
  codigo: string;
  nivel: number;
  permisos: string[];
  descripcion?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CargoSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // Enforce uppercase for consistency with legacy data
    },
    codigo: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      // Will be auto-generated if missing, but schema enforces uniqueness
    },
    nivel: {
      type: Number,
      default: 10, // 0-100 scale: 10=User, 50=Manager, 100=Admin
    },
    permisos: [
      {
        type: String,
        trim: true,
      },
    ],
    descripcion: {
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

export default mongoose.model<ICargo>("Cargo", CargoSchema);

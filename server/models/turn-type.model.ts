import mongoose, { Document, Schema } from "mongoose";

export interface ITurnType extends Document {
  nombre: string;
  codigo: string;
  descripcion?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TurnTypeSchema: Schema = new Schema(
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

export default mongoose.model<ITurnType>("TurnType", TurnTypeSchema);

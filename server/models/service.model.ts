import mongoose, { Document, Schema } from "mongoose";

export interface IService extends Document {
  nombre: string;
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

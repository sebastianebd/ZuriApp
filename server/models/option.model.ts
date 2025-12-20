import mongoose, { Schema, Document } from "mongoose";

export interface IOption extends Document {
  nombre: string;
  opciones: string[];
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema: Schema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    opciones: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) =>
          arr.every((opt) => typeof opt === "string"),
        message: "Todas las opciones deben ser strings",
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IOption>("Option", optionSchema);

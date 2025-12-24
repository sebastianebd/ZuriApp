import mongoose, { Schema, Document } from "mongoose";
import validator from "validator";

export interface IUser extends Document {
  rut: string;
  nombre: string;
  apellido: string;
  fecha_nac: Date;
  direccion: string;
  telefono: string;
  email: string;
  ciudad: string;
  tipo_cargo: string;
  eliminado: boolean;
  password?: string;
  servicio?: string;
  habilitado?: string;
  refresh_token?: string;
  created_at: Date;
  updated_at: Date;

  // Virtuals
  full_name: string;
}

const userSchema: Schema = new Schema(
  {
    rut: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    nombre: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    apellido: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    fecha_nac: {
      type: Date,
      required: true,
    },
    direccion: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    telefono: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (val: string) => /^\+?[0-9]{8,15}$/.test(val),
        message: "Número de teléfono no válido",
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Email no válido"],
    },
    ciudad: {
      type: String,
      required: true,
      uppercase: true,
    },
    tipo_cargo: {
      type: String,
      required: true,
      uppercase: true,
    },
    eliminado: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    servicio: {
      type: String,
      required: function (this: any) {
        return this.tipo_cargo === "JEFA SERVICIO";
      },
      uppercase: true,
    },
    habilitado: {
      type: String,
      required: function (this: any) {
        return this.tipo_cargo === "TENS";
      },
      enum: ["HABILITADO", "NO HABILITADO"],
      default: "HABILITADO",
      uppercase: true,
      trim: true,
    },
    refresh_token: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("id").get(function (this: any) {
  // Using any for this context as Mongoose document typing in virtual getter is tricky with strict mode
  return this._id.toHexString();
});

userSchema.virtual("full_name").get(function (this: any) {
  return `${this.nombre} ${this.apellido}`;
});

export default mongoose.model<IUser>("User", userSchema);

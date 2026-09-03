import mongoose, { Document, Schema } from "mongoose";

export interface IStaff extends Document {
  rut: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  address: string;
  phone: string;
  email: string;
  city: string;
  contractType: string;
  isActive: boolean;
  roleId: mongoose.Types.ObjectId;
  positionId: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema: Schema = new Schema(
  {
    rut: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    birthDate: { type: Date, required: true },
    address: { type: String, trim: true, required: true },
    phone: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, required: true },
    city: { type: String, trim: true, required: true },
    contractType: {
      type: String,
      enum: ["CONTRATA", "PLANTA", "HONORARIO"],
      required: true,
    },
    isActive: { type: Boolean, default: true, required: true },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    positionId: {
      type: Schema.Types.ObjectId,
      ref: "Position",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const STAFF_AUDIT_FIELDS = [
  "rut",
  "firstName",
  "lastName",
  "email",
  "phone",
  "isActive",
  "roleId",
  "positionId",
];

export default mongoose.model<IStaff>("Staff", StaffSchema);

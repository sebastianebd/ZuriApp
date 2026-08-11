import mongoose, { Document, Schema } from 'mongoose';

export interface IStaff extends Document {
  rut: string;
  firstName: string;
  lastName: string;
  birthDate?: Date;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
  contractType?: string;
  status?: string;
  roleId: mongoose.Types.ObjectId;
  positionId?: mongoose.Types.ObjectId;
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
    birthDate: { type: Date },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    city: { type: String, trim: true },
    contractType: { type: String },
    status: { type: String, default: 'HABILITADO' },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    positionId: {
      type: Schema.Types.ObjectId,
      ref: 'Position',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const STAFF_AUDIT_FIELDS = [
  "rut",
  "firstName",
  "lastName",
  "email",
  "phone",
  "status",
  "roleId",
  "positionId",
];

export default mongoose.model<IStaff>('Staff', StaffSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IAccount extends Document {
  staffId: mongoose.Types.ObjectId;
  rut: string; // Used for login
  password?: string;
  refresh_token?: string;
  isActive: boolean; // False until OTL is completed
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema: Schema = new Schema(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      unique: true,
    },
    rut: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    refresh_token: {
      type: String,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: false, // Must be activated via OTL
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

export const ACCOUNT_AUDIT_FIELDS = [
  "staffId",
  "rut",
  "isActive",
];

export default mongoose.model<IAccount>('Account', AccountSchema);

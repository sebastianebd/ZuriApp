import mongoose, { Document, Schema } from 'mongoose';

export interface IPosition extends Document {
  name: string;
  position_code: string;
  description?: string;
  isActive: boolean;
  deleted_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PositionSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    position_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
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
  }
);

export const POSITION_AUDIT_FIELDS = [
  "name",
  "position_code",
  "description",
  "isActive",
];

export default mongoose.model<IPosition>('Position', PositionSchema);

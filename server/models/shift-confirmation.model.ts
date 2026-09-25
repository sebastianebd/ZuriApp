import mongoose, { Schema, Document } from 'mongoose';

export interface IShiftConfirmation extends Document {
  staffId: mongoose.Types.ObjectId;
  assignmentId: mongoose.Types.ObjectId;
  assignmentModel: 'TurnAssignment' | 'Replacement';
  serviceId: mongoose.Types.ObjectId;
  date: Date;
  status: 'confirmed' | 'unavailable';
  reason?: string;
  confirmedAt: Date;
  source: 'pwa';
  created_at: Date;
  updated_at: Date;
}

const shiftConfirmationSchema = new Schema<IShiftConfirmation>(
  {
    staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
    assignmentId: { type: Schema.Types.ObjectId, required: true },
    assignmentModel: {
      type: String,
      enum: ['TurnAssignment', 'Replacement'],
      required: true,
    },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['confirmed', 'unavailable'],
      required: true,
    },
    reason: { type: String, maxlength: 500 },
    confirmedAt: { type: Date, default: Date.now },
    source: { type: String, default: 'pwa' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

shiftConfirmationSchema.index({ staffId: 1, date: 1, assignmentId: 1 }, { unique: true });
shiftConfirmationSchema.index({ serviceId: 1, date: 1, status: 1 });

const ShiftConfirmation =
  mongoose.models.ShiftConfirmation ||
  mongoose.model<IShiftConfirmation>('ShiftConfirmation', shiftConfirmationSchema);

export default ShiftConfirmation;

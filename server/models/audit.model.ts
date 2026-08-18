import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  module: string;
  description: string;
  details: any;
  accountId?: mongoose.Types.ObjectId;
  accountName?: string;
  resource_id?: string;
  created_at: Date;
  updated_at: Date;
}

const auditLogSchema: Schema = new Schema(
  {
    action: {
      type: String,
      required: true,
      uppercase: true,
    },
    module: {
      type: String,
      required: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: null,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: false,
    },
    accountName: {
      type: String,
      required: false,
    },
    resource_id: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

export default mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

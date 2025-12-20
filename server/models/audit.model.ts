import mongoose, { Schema, Document, Model, PaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

export interface IAuditLog extends Document {
  action: string;
  module: string;
  description: string;
  details: any;
  user_id?: mongoose.Types.ObjectId;
  user_name?: string;
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
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    user_name: {
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

auditLogSchema.plugin(mongoosePaginate);

interface AuditLogModel extends PaginateModel<IAuditLog> {}

export default mongoose.model<IAuditLog, AuditLogModel>(
  "AuditLog",
  auditLogSchema
);

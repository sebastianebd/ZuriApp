import mongoose, { Schema, Document } from "mongoose";

export interface ILoginHistory extends Document {
  accountId: mongoose.Types.ObjectId;
  ip: string;
  userAgent: string;
  status: "SUCCESS" | "FAILED";
  timestamp: Date;
}

const loginHistorySchema: Schema = new Schema({
  accountId: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  ip: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["SUCCESS", "FAILED"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30, // Optional: Auto-delete after 30 days to save space
  },
});

export default mongoose.model<ILoginHistory>(
  "LoginHistory",
  loginHistorySchema
);

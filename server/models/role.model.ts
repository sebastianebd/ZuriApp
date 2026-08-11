import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
  code: string;
  level: number;
  permissions: string[];
  hasSystemAccess: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    level: {
      type: Number,
      default: 0,
    },
    permissions: {
      type: [String],
      default: [],
    },
    hasSystemAccess: {
      type: Boolean,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ROLE_AUDIT_FIELDS = [
  "name",
  "code",
  "level",
  "permissions",
  "hasSystemAccess",
  "description",
];

export default mongoose.model<IRole>('Role', RoleSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IAlert extends Document {
  ruleId: 'NORM-01' | 'NORM-02' | 'NORM-03' | 'NORM-06' | 'OPS-01' | 'OPS-02' | 'OPS-03' | 'OPS-04' | 'OPS-05';
  severity: 'critical' | 'high' | 'medium';
  category: 'normative' | 'operational';
  serviceId: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  date?: Date;
  shiftSlot?: 'DIA' | 'NOCHE';
  positionId?: mongoose.Types.ObjectId;
  message: string;
  context: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  resolutionNote?: string;
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  created_at: Date;
  updated_at: Date;
}

const AlertSchema: Schema = new Schema(
  {
    ruleId: {
      type: String,
      required: true,
      enum: ['NORM-01', 'NORM-02', 'NORM-03', 'NORM-06', 'OPS-01', 'OPS-02', 'OPS-03', 'OPS-04', 'OPS-05'],
    },
    severity: {
      type: String,
      required: true,
      enum: ['critical', 'high', 'medium'],
    },
    category: {
      type: String,
      required: true,
      enum: ['normative', 'operational'],
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    date: {
      type: Date,
      default: null,
    },
    shiftSlot: {
      type: String,
      enum: ['DIA', 'NOCHE', null],
      default: null,
    },
    positionId: {
      type: Schema.Types.ObjectId,
      ref: 'Position',
      default: null,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    context: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active',
      index: true,
    },
    resolutionNote: {
      type: String,
      trim: true,
      default: null,
    },
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  }
);

// 1. Idempotencia OPS-01 (Cobertura de Dotación)
AlertSchema.index(
  { serviceId: 1, ruleId: 1, date: 1, shiftSlot: 1, positionId: 1, status: 1 },
  { partialFilterExpression: { ruleId: 'OPS-01', status: 'active' }, name: 'idx_idempotency_ops01' }
);

// 2. Idempotencia Individual (Normativas)
AlertSchema.index(
  { staffId: 1, ruleId: 1, date: 1, status: 1 },
  { partialFilterExpression: { staffId: { $exists: true }, status: 'active' }, name: 'idx_idempotency_individual' }
);

// 3. Consulta Rápida por Servicio (Campana UI)
AlertSchema.index({ serviceId: 1, status: 1, created_at: -1 });

// 4. Historial por Funcionario
AlertSchema.index({ staffId: 1, created_at: -1 }, { sparse: true });

export default mongoose.model<IAlert>('Alert', AlertSchema);

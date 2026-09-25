import mongoose, { Schema, Document } from 'mongoose';
import { AusenciaSalienteMotivo } from './replacement.model';

export interface IReplacementOfferApplicant {
  staffId: mongoose.Types.ObjectId;
  appliedAt: Date;
  scoreAtApplication?: number;
  status: 'pending' | 'selected' | 'not_selected' | 'cancelled_by_staff' | 'withdrawn_conflict';
}

export interface IReplacementOffer extends Document {
  serviceId: mongoose.Types.ObjectId;
  positionId: mongoose.Types.ObjectId;
  id_saliente: mongoose.Types.ObjectId;
  rut_saliente: string;
  nombre_saliente: string;
  apellido_saliente: string;
  motivo: AusenciaSalienteMotivo;
  observaciones?: string;
  tipo_turno: string;
  turn_type_id?: mongoose.Types.ObjectId;
  fecha_inicio: Date;
  fecha_termino: Date;
  snapshot_secuencia?: Array<{
    dia: number;
    turno_entrada?: string;
    turno_salida?: string;
    es_libre: boolean;
    sigla: string;
  }>;
  creado_por: mongoose.Types.ObjectId;
  expiresAt: Date;
  status: 'open' | 'finalized' | 'filled' | 'cancelled';
  applicants: IReplacementOfferApplicant[];
  awardedStaffId?: mongoose.Types.ObjectId;
  replacementId?: mongoose.Types.ObjectId;
  awardedAt?: Date;
  created_at: Date;
  updated_at: Date;
}

const applicantSchema = new Schema<IReplacementOfferApplicant>(
  {
    staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    appliedAt: { type: Date, default: Date.now },
    scoreAtApplication: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'selected', 'not_selected', 'cancelled_by_staff', 'withdrawn_conflict'],
      default: 'pending',
    },
  },
  { _id: false }
);

const replacementOfferSchema = new Schema<IReplacementOffer>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    positionId: { type: Schema.Types.ObjectId, ref: 'Position', required: true },
    id_saliente: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    rut_saliente: { type: String, required: true },
    nombre_saliente: { type: String, required: true },
    apellido_saliente: { type: String, required: true },
    motivo: {
      type: String,
      enum: [
        'LICENCIA_MEDICA',
        'PRE_POST_NATAL',
        'PERMISO_ADMINISTRATIVO',
        'FERIADO_LEGAL',
        'DIA_COMPENSATORIO',
        'COMISION_SERVICIO',
        'PERMISO_GREMIAL',
        'OTRO',
      ],
      required: true,
    },
    observaciones: { type: String },
    tipo_turno: { type: String, required: true },
    turn_type_id: { type: Schema.Types.ObjectId, ref: 'TurnType' },
    fecha_inicio: { type: Date, required: true },
    fecha_termino: { type: Date, required: true },
    snapshot_secuencia: [
      {
        dia: { type: Number, required: true },
        turno_entrada: { type: String },
        turno_salida: { type: String },
        es_libre: { type: Boolean, required: true },
        sigla: { type: String, required: true },
      },
    ],
    creado_por: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['open', 'finalized', 'filled', 'cancelled'],
      default: 'open',
    },
    applicants: [applicantSchema],
    awardedStaffId: { type: Schema.Types.ObjectId, ref: 'Staff' },
    replacementId: { type: Schema.Types.ObjectId, ref: 'Replacement' },
    awardedAt: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Índices para optimizar consultas y control de concurrencia
replacementOfferSchema.index({ serviceId: 1, status: 1 });
replacementOfferSchema.index({ positionId: 1, status: 1 });
replacementOfferSchema.index({ expiresAt: 1, status: 1 });
replacementOfferSchema.index({ 'applicants.staffId': 1 });

const ReplacementOfferModel = mongoose.model<IReplacementOffer>(
  'ReplacementOffer',
  replacementOfferSchema
);

export default ReplacementOfferModel;

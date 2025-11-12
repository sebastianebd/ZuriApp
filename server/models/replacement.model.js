const mongoose = require("mongoose");
const Counter = require("./counter");

const replacementSchema = new mongoose.Schema(
  {
    id_negocio: {
      type: String,
      uppercase: true,
    },
    id_saliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rut_saliente: {
      type: String,
      required: true,
      uppercase: true,
    },
    nombre_saliente: {
      type: String,
      required: true,
      uppercase: true,
    },
    apellido_saliente: {
      type: String,
      required: true,
      uppercase: true,
    },
    id_entrante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rut_entrante: {
      type: String,
      required: true,
      uppercase: true,
    },
    nombre_entrante: {
      type: String,
      required: true,
      uppercase: true,
    },
    apellido_entrante: {
      type: String,
      required: true,
      uppercase: true,
    },
    tipo_turno: {
      type: String,
      required: true,
      uppercase: true,
    },
    fecha_inicio: {
      type: Date,
      required: true,
    },
    fecha_termino: {
      type: Date,
      required: true,
    },
    servicio: {
      type: String,
      required: true,
      uppercase: true,
    },
    status: {
      type: String,
      default: "PENDIENTE",
      uppercase: true,
    },
    creado_por: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refresh_token: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

replacementSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

replacementSchema.pre("save", async function (next) {
  if (this.id_negocio) return next();

  try {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const prefix = "RP";
    const counterId = `replacementId_${currentYear}`;

    let counter = await Counter.findOneAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { new: true }
    );

    if (!counter) {
      await Counter.create({ _id: counterId });
      counter = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { new: true }
      );
    }
    const nuevoNumero = counter.seq;
    this.id_negocio = `${prefix}${nuevoNumero}${currentYear}`;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports =
  mongoose.models.Replacement ||
  mongoose.model("Replacement", replacementSchema);

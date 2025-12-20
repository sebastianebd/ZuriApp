const mongoose = require("mongoose");
const Counter = require("./counter");

/**
 * @swagger
 * components:
 *   schemas:
 *     Reemplazo:
 *       type: object
 *       required:
 *         - id_saliente
 *         - rut_saliente
 *         - nombre_saliente
 *         - apellido_saliente
 *         - id_entrante
 *         - rut_entrante
 *         - nombre_entrante
 *         - apellido_entrante
 *         - tipo_turno
 *         - fecha_inicio
 *         - fecha_termino
 *         - servicio
 *         - creado_por
 *       properties:
 *         id_saliente:
 *           type: string
 *           description: Mongo ID del usuario saliente
 *         rut_saliente:
 *           type: string
 *         nombre_saliente:
 *           type: string
 *         apellido_saliente:
 *           type: string
 *         id_entrante:
 *           type: string
 *           description: Mongo ID del usuario entrante
 *         rut_entrante:
 *           type: string
 *         nombre_entrante:
 *           type: string
 *         apellido_entrante:
 *           type: string
 *         tipo_turno:
 *           type: string
 *           enum: [DIURNO, NOCTURNO, 24 HORAS]
 *         fecha_inicio:
 *           type: string
 *           format: date
 *         fecha_termino:
 *           type: string
 *           format: date
 *         servicio:
 *           type: string
 *           example: "ARO"
 *         creado_por:
 *           type: string
 *           description: Mongo ID del usuario que crea el reemplazo
 *
 *     Sustitucion:
 *       type: object
 *       required:
 *         - id_registro_a
 *         - fecha_corte_a
 *         - nuevo_entrante
 *         - datos_base_evento
 *       properties:
 *         id_registro_a:
 *           type: string
 *           description: ID del reemplazo a cortar
 *         fecha_corte_a:
 *           type: string
 *           format: date
 *         nuevo_entrante:
 *           type: object
 *           properties:
 *             id_entrante:
 *               type: string
 *             rut_entrante:
 *               type: string
 *             nombre_entrante:
 *               type: string
 *             apellido_entrante:
 *               type: string
 *         datos_base_evento:
 *           type: object
 *           description: Copia de los datos del evento original para el nuevo
 *
 */

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
    corte_anticipado: {
      type: Boolean,
      default: false,
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
    this.id_negocio = `${prefix}${currentYear}${nuevoNumero}`;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports =
  mongoose.models.Replacement ||
  mongoose.model("Replacement", replacementSchema);

const mongoose = require("mongoose");
const validator = require("validator");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         rut:
 *           type: string
 *           description: Identificador único nacional
 *         nombre:
 *           type: string
 *         apellido:
 *           type: string
 *         fecha_nac:
 *           type: string
 *         direccion:
 *           type: string
 *         ciudad:
 *           type: string
 *         telefono:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         tipo_cargo:
 *           type: string
 *           enum: [ADMIN, TENS, JEFA SERVICIO]
 *         habilitado:
 *           type: string
 *           enum: [HABILITADO, NO HABILITADO]
 *       example:
 *         rut: 12345678-9
 *         nombre: JUAN
 *         apellido: PEREZ
 *         fecha_nac: 2024-01-01
 *         direccion: 123 calle
 *         ciudad: SANTIAGO
 *         telefono: 12345678
 *         email: juan@test.com
 *         tipo_cargo: TENS
 *         habilitado: HABILITADO
 */

const userSchema = new mongoose.Schema(
  {
    rut: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    nombre: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    apellido: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    fecha_nac: {
      type: Date,
      required: true,
    },
    direccion: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    telefono: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (val) => /^[0-9]{8,15}$/.test(val),
        message: "Número de teléfono no válido",
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Email no válido"],
    },
    ciudad: {
      type: String,
      required: true,
      uppercase: true,
    },
    tipo_cargo: {
      type: String,
      required: true,
      uppercase: true,
    },
    eliminado: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    servicio: {
      type: String,
      required: function () {
        return this.tipo_cargo === "JEFA SERVICIO";
      },
      uppercase: true,
    },

    habilitado: {
      type: String,
      required: function () {
        return this.tipo_cargo === "TENS";
      },
      enum: ["HABILITADO", "NO HABILITADO"],
      default: "HABILITADO",
      uppercase: true,
      trim: true,
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

userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

userSchema.virtual("full_name").get(function () {
  return `${this.nombre} ${this.apellido}`;
});

module.exports = mongoose.model("User", userSchema);

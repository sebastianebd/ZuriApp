const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ReemplazoSchema = Schema(
  {
    id_saliente:{
      type: String,
      required: true
    },
    rut_saliente:{
      type: String,
      required: true,
      uppercase: true
    },

    nombre_saliente: {
      type: String,
      required: true,
      uppercase: true
    },

    apellido_saliente: {
      type: String,
      required: true,
      uppercase: true
    },

    id_entrante:{
      type: String,
      required: true
    },

    rut_entrante:{
      type: String,
      required: true,
      uppercase: true
    },

    nombre_entrante: {
      type: String,
      required: true,
      uppercase: true
    },

    apellido_entrante: {
      type: String,
      required: true,
      uppercase: true
    },

    tipo_turno: {
      type: String,
      required: true,
      uppercase: true
    },

    fecha_inicio: {
      type: Date,
      required: true,
      uppercase: true
    },

    fecha_termino: {
      type: Date,
      required: true,
      uppercase: true
    },

    servicio: {
      type: String,
      required: true,
      uppercase: true
    },
    eliminado: {
      type: Boolean,
      default: false
    },
    activo: {
      type: Boolean,
      default: true
    },
    refresh_token: String
  },
  {
    virtuals:{
      id: {
        get(){
          return this._id
        }
      }
    },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  },
  
)

module.exports = mongoose.model('Reemplazo', ReemplazoSchema)




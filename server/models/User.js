const mongoose = require('mongoose')

const Schema = mongoose.Schema

const UserSchema = Schema(
  {
    rut:{
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },

    nombre: {
      type: String,
      required: true,
      uppercase: true,
    },

    apellido: {
      type: String,
      required: true,
      uppercase: true,
    },

    fecha_nac: {
      type: Date,
      required: true,
      uppercase: true,
    },

    direccion: {
      type: String,
      required: true,
      uppercase: true,
    },

    telefono: {
      type: Number,
      required: true,
      unique: true
    },
    email:{
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
      validate: [
        (val) => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(val),
      ]
    },

    ciudad: {
      type: String,
      required: true,
      uppercase: true,
    },

    tipo_cargo: {
      type: String,
      required: true,
      uppercase: true
    },

    eliminado: {
      type: Boolean,
      default: false
    },

    password: {
      type: String,
      required: true,
    },

    servicio: {
      type: String,
      required: function() {
        return this.tipo_cargo === 'JEFA SERVICIO';
      },
    },

    habilitado: {
      type: String,
      required: function() {
        return this.tipo_cargo === 'TENS';
      },

    refresh_token: String
    
  }
},


  {
    virtuals:{
      full_name: {
        get(){
          return this.nombre + ' ' + this.apellido
        }
      },

      id: {
        get(){
          return this._id
        }
      }
    },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  },
  
)

module.exports = mongoose.model('User', UserSchema)




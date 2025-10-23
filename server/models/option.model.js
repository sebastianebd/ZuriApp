const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    opciones: {
      type: [String],
      default: [],
      validate: {
        validator: arr => arr.every(opt => typeof opt === 'string'),
        message: 'Todas las opciones deben ser strings'
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Option', optionSchema);

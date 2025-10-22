const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  nombre: String,
  opciones: [String]
});

const Option = mongoose.model('Option', optionSchema);

module.exports = Option;
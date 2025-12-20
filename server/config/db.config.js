const mongoose = require("mongoose");
const logger = require("./logger.config");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    logger.info("✅ Conectado a MongoDB");
  } catch (error) {
    logger.error(`❌ Error al conectar a MongoDB: ${error}`);
    process.exit(1);
  }
};

module.exports = connectDB;

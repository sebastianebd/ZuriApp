import mongoose from "mongoose";
import logger from "./logger.config";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.DATABASE_URI as string);
    logger.info("✅ Conectado a MongoDB");
  } catch (error) {
    logger.error(`❌ Error al conectar a MongoDB: ${error}`);
    process.exit(1);
  }
};

export default connectDB;

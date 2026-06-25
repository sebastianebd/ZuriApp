import mongoose from "mongoose";
import logger from "./logger.config";

// Gestión de Conexión a Base de Datos
// Establece la conexión inicial con MongoDB usando Mongoose.
// Nota: Mongoose gestiona internamente un pool de conexiones, por lo que no es necesario
// abrir/cerrar conexiones por solicitud.
const connectDB = async (): Promise<void> => {
  try {
    // La conexión es asíncrona pero bloqueante para el inicio del servidor
    // (ver server.ts: 'once("open")').
    await mongoose.connect(process.env.DATABASE_URI as string);
    logger.info("✅ Conectado a MongoDB");
  } catch (error) {
    // Fallo Crítico
    // Si la base de datos no está disponible al inicio, la aplicación no puede funcionar.
    // Salimos con código 1 para que el orquestador (Docker/K8s) reinicie el contenedor.
    logger.error(`❌ Error al conectar a MongoDB: ${error}`);
    process.exit(1);
  }
};

export default connectDB;

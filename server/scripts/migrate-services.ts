import dotenv from "dotenv";
import path from "path";
// Cargar .env desde la raíz
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.config";
import Service from "../models/service.model";
import logger from "../config/logger.config";

async function runMigration() {
  await connectDB();
  
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("DB connection not established");
  }

  logger.info("Starting Service string to ObjectId migration...");

  try {
    // 1. Extraer todos los strings de servicio únicos de Users, TurnAssignments y Replacements
    const usersCollection = db.collection("users");
    const turnsCollection = db.collection("turnassignments");
    const replsCollection = db.collection("replacements");

    // Usamos distinct pero filtramos por $type: "string" para no tomar ObjectIds 
    const uniqueUserServices = await usersCollection.distinct("servicio", { "servicio": { $type: "string" } });
    const uniqueTurnServices = await turnsCollection.distinct("service", { "service": { $type: "string" } });
    const uniqueReplServices = await replsCollection.distinct("servicio", { "servicio": { $type: "string" } });

    // Combinar y deduplicar (ignorando nulos/indefinidos)
    const allUniqueServices = Array.from(new Set([
      ...uniqueUserServices, 
      ...uniqueTurnServices,
      ...uniqueReplServices
    ])).filter(Boolean);

    logger.info(`Found ${allUniqueServices.length} unique string services to migrate:`, allUniqueServices);

    if (allUniqueServices.length === 0) {
      logger.info("No strings found to migrate. Database might already be migrated.");
    } else {
      const serviceMap = new Map<string, mongoose.Types.ObjectId>();

      // 2. Asegurar que los servicios existan en la colección Service
      for (const serviceName of allUniqueServices) {
        const normalizedName = serviceName.toString().toUpperCase().trim();
        let serviceDoc = await Service.findOne({ nombre: normalizedName });
        
        if (!serviceDoc) {
          logger.info(`Creating missing service in DB: ${normalizedName}`);
          serviceDoc = await Service.create({
            nombre: normalizedName,
            activo: true
          });
        }
        
        serviceMap.set(serviceName.toString(), serviceDoc._id as mongoose.Types.ObjectId);
      }

      // 3. Actualizar Users
      logger.info("Updating users...");
      let usersUpdated = 0;
      for (const [stringName, objectId] of serviceMap.entries()) {
        const result = await usersCollection.updateMany(
          { servicio: stringName },
          { $set: { servicio: objectId } }
        );
        usersUpdated += result.modifiedCount;
      }
      logger.info(`Updated ${usersUpdated} users.`);

      // 4. Actualizar TurnAssignments
      logger.info("Updating turn assignments...");
      let turnsUpdated = 0;
      for (const [stringName, objectId] of serviceMap.entries()) {
        const result = await turnsCollection.updateMany(
          { service: stringName },
          { $set: { service: objectId } }
        );
        turnsUpdated += result.modifiedCount;
      }
      logger.info(`Updated ${turnsUpdated} turn assignments.`);

      // 4b. Actualizar Replacements
      logger.info("Updating replacements...");
      let replsUpdated = 0;
      for (const [stringName, objectId] of serviceMap.entries()) {
        const result = await replsCollection.updateMany(
          { servicio: stringName },
          { $set: { servicio: objectId } }
        );
        replsUpdated += result.modifiedCount;
      }
      logger.info(`Updated ${replsUpdated} replacements.`);
    }

    // 5. Eliminar "SERVICIOS" de la colección genérica Options (Limpieza)
    const optionsCollection = db.collection("options");
    const optionResult = await optionsCollection.deleteOne({ nombre: "SERVICIOS" });
    if (optionResult.deletedCount > 0) {
      logger.info("Removed SERVICIOS from legacy options collection.");
    }

    logger.info("Migration completed successfully! 🎉");
  } catch (error) {
    logger.error("Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Ejecutar inmediatamente
runMigration();

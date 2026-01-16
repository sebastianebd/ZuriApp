import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const rawUri =
  process.env.DATABASE_URI || "mongodb://localhost:27017/turnos-db";
// Patch for running local script against Docker env config
const MONGO_URI = rawUri.replace("mongo:", "localhost:");

async function dropLegacyIndexes() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection failed");

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    // 1. TurnSiglas
    if (collectionNames.includes("turnsiglas")) {
      console.log("Checking TurnSiglas indexes...");
      const siglaColl = db.collection("turnsiglas");
      try {
        const siglaIndexes = await siglaColl.indexes();
        for (const idx of siglaIndexes) {
          if (idx.key.sigla && idx.unique && !idx.partialFilterExpression) {
            console.log(
              `Dropping legacy unique index: ${idx.name} on TurnSigla`
            );
            await siglaColl.dropIndex(idx.name!);
          }
        }
      } catch (e) {
        console.warn("Could not read indexes for turnsiglas", e);
      }
    } else {
      console.log("Collection turnsiglas not found, skipping.");
    }

    // 2. TurnTypes
    if (collectionNames.includes("turntypes")) {
      console.log("Checking TurnTypes indexes...");
      const typeColl = db.collection("turntypes");
      try {
        const typeIndexes = await typeColl.indexes();
        for (const idx of typeIndexes) {
          if (
            (idx.key.nombre || idx.key.codigo) &&
            idx.unique &&
            !idx.partialFilterExpression
          ) {
            console.log(
              `Dropping legacy unique index: ${idx.name} on TurnType`
            );
            await typeColl.dropIndex(idx.name!);
          }
        }
      } catch (e) {
        console.warn("Could not read indexes for turntypes", e);
      }
    } else {
      console.log("Collection turntypes not found, skipping.");
    }

    console.log(" Legacy indexes dropped successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error dropping indexes:", error);
    process.exit(1);
  }
}

dropLegacyIndexes();

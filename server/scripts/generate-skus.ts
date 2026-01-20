import mongoose from "mongoose";
import Service from "../models/service.model";
import TurnType from "../models/turn-type.model";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from root
dotenv.config({ path: path.join(__dirname, "../../.env") });

const connectDB = async () => {
  try {
    let uri = process.env.DATABASE_URI || "mongodb://localhost:27017/zuriapp";

    // Replace 'mongo' with 'localhost' for local execution if needed
    if (uri.includes("//mongo")) {
      console.log('Replacing "mongo" with "localhost" for local execution');
      uri = uri.replace("//mongo", "//localhost");
    }

    uri = uri.replace(/['"]/g, "").trim();

    console.log(`Connecting to: ${uri}`);
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to DB: ${error}`);
    process.exit(1);
  }
};

const generateSkus = async () => {
  await connectDB();

  try {
    // 1. Patch Services
    console.log("\n--- Patching Services ---");
    const services = await Service.find({}).sort({ createdAt: 1, nombre: 1 });
    // Sort by createdAt to allow "older" services to get lower IDs

    // We need to calculate global sequence cleanly.
    // If some services ALREADY have codes (e.g. created during development manually), we should respect them?
    // Or just re-generate all to be consistent?
    // User said "mis servicios que tengo guardados", implying existing ones don't have codes.
    // Safe bet: Regenerate ALL to ensure consistency based on the new logic.
    // OR: Check existing max sequence.

    // Let's regenerate ALL to guarantee format correctness and sequence.
    // Sorting by createdAt ensures stability.

    let serviceSeq = 1;

    for (const service of services) {
      if (service.codigo && /^[A-Z]{3}-\d{3}$/.test(service.codigo)) {
        // If it already matches format, maybe skip?
        // But user might want to re-sequence.
        // Let's force update if code is missing or we want to normalize.
        // Given the request, it's likely they are missing.
      }

      const words = service.nombre.trim().split(/\s+/);
      let prefix = "";
      if (words.length === 1) {
        prefix = words[0].substring(0, 3).toUpperCase();
      } else {
        const first = words[0].substring(0, 1);
        const second = words[1].substring(0, 2);
        prefix = (first + second).toUpperCase();
      }

      const newCode = `${prefix}-${serviceSeq.toString().padStart(3, "0")}`;

      // Update only if different to reduce writes
      if (service.codigo !== newCode) {
        service.codigo = newCode;
        await service.save();
        console.log(`Updated Service: ${service.nombre} -> ${newCode}`);
      } else {
        console.log(
          `Skipped Service (Identical): ${service.nombre} -> ${newCode}`
        );
      }

      serviceSeq++;
    }

    // 2. Patch Turn Types
    console.log("\n--- Patching Turn Types ---");
    const turnTypes = await TurnType.find({}).sort({ createdAt: 1, nombre: 1 });

    let turnSeq = 1;

    for (const turn of turnTypes) {
      const words = turn.nombre.trim().split(/\s+/);
      let prefix = "";
      if (words.length === 1) {
        prefix = words[0].substring(0, 3).toUpperCase();
      } else {
        const first = words[0].substring(0, 1);
        const second = words[1].substring(0, 2);
        prefix = (first + second).toUpperCase();
      }

      const newCode = `${prefix}-${turnSeq.toString().padStart(3, "0")}`;

      if (turn.codigo !== newCode) {
        turn.codigo = newCode;
        await turn.save();
        console.log(`Updated TurnType: ${turn.nombre} -> ${newCode}`);
      } else {
        console.log(
          `Skipped TurnType (Identical): ${turn.nombre} -> ${newCode}`
        );
      }
      turnSeq++;
    }

    console.log("\nAll SKUs generated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error generating SKUs:", error);
    process.exit(1);
  }
};

generateSkus();

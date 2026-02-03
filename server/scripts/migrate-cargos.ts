import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import User from "../models/user.model";
import Cargo from "../models/cargo.model";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const migrateCargos = async () => {
  try {
    if (!process.env.DATABASE_URI) {
      throw new Error("DATABASE_URI not defined");
    }

    // Replace 'mongo' with 'localhost' if running from host
    let uri = process.env.DATABASE_URI;
    if (uri.includes("//mongo")) {
      console.log('Replacing "mongo" with "localhost" for local execution');
      uri = uri.replace("//mongo", "//localhost");
    }

    // Clean potential quotes
    uri = uri.replace(/['"]/g, "").trim();

    console.log(`Connecting to: ${uri}`);

    await mongoose.connect(uri);
    console.log("Connected.");

    console.log("Fetching users...");
    const users = await User.find({}).select("tipo_cargo");
    console.log(`Found ${users.length} users.`);

    const cargosSet = new Set<string>();
    users.forEach((u) => {
      if (u.tipo_cargo) {
        cargosSet.add(u.tipo_cargo.trim().toUpperCase());
      }
    });

    console.log(
      `Found ${cargosSet.size} unique cargos:`,
      Array.from(cargosSet)
    );

    let createdCount = 0;
    let skippedCount = 0;

    for (const cargoName of cargosSet) {
      const existing = await Cargo.findOne({ nombre: cargoName });
      if (!existing) {
        await Cargo.create({
          nombre: cargoName,
          descripcion: "Migrado automÃ¡ticamente desde usuarios",
        });
        console.log(`Created: ${cargoName}`);
        createdCount++;
      } else {
        console.log(`Skipped (Exists): ${cargoName}`);
        skippedCount++;
      }
    }

    console.log("Migration finished.");
    console.log(`Created: ${createdCount}`);
    console.log(`Skipped: ${skippedCount}`);

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateCargos();

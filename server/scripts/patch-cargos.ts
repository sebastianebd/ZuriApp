import mongoose from "mongoose";
import Cargo from "../models/cargo.model";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from root (../../.env relative to server/scripts)
dotenv.config({ path: path.join(__dirname, "../../.env") });

const connectDB = async () => {
  try {
    let uri = process.env.DATABASE_URI || "mongodb://localhost:27017/zuriapp";

    // Replace 'mongo' with 'localhost' if running from host so we can hit the mapped port
    if (uri.includes("//mongo")) {
      console.log('Replacing "mongo" with "localhost" for local execution');
      uri = uri.replace("//mongo", "//localhost");
    }

    // Clean potential quotes
    uri = uri.replace(/['"]/g, "").trim();

    console.log(`Connecting to: ${uri}`);
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to DB: ${error}`);
    process.exit(1);
  }
};

const patchCargos = async () => {
  await connectDB();

  try {
    const cargos = await Cargo.find({}); // Find all
    console.log(`Found ${cargos.length} cargos to patch.`);

    // Sort cargos, maybe by name or createdAt to have a stable sequence assignment
    // Assuming createdAt exists, if not sort by name
    cargos.sort((a, b) => a.nombre.localeCompare(b.nombre));

    let globalSequence = 1;

    for (const cargo of cargos) {
      // Force rewrite of code using global logic
      const prefix = cargo.nombre.substring(0, 3).toUpperCase();

      const newCode = `${prefix}-${globalSequence.toString().padStart(3, "0")}`;

      // Update IF it's different (or just always update to be sure)
      cargo.codigo = newCode;

      // Also ensure nivel/permissions are there
      // Force Update of Level/Permissions to defaults
      // Force Update of Level/Permissions to defaults
      if (cargo.nombre.includes("ADMIN") || cargo.nombre.includes("JEFE")) {
        cargo.nivel = 100;
        cargo.permisos = [
          "users.manage",
          "cargos.manage",
          "shifts.manage",
          "replacement.manage",
          "audit.view",
          "config.view",
          "config.manage",
        ];
      } else if (
        cargo.nombre.includes("SUPERVISOR") ||
        cargo.nombre.includes("COORDINADOR") ||
        cargo.nombre.includes("RECURSOS")
      ) {
        cargo.nivel = 50;
        cargo.permisos = [
          "users.manage",
          "shifts.manage",
          "replacement.manage",
          "config.view",
        ];
      } else {
        cargo.nivel = 10;
        cargo.permisos = [];
      }
      if (!cargo.permisos) cargo.permisos = [];

      await cargo.save();
      console.log(`Patched ${cargo.nombre} -> New Code: ${cargo.codigo}`);

      globalSequence++;
    }

    console.log("Cargo patching completed (Global Sequence)!");
    process.exit(0);
  } catch (error) {
    console.error("Error patching cargos:", error);
    process.exit(1);
  }
};

patchCargos();

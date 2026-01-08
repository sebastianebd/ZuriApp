import axios from "axios";
import mongoose from "mongoose";
import replacementService from "../services/replacement.service";
import User from "../models/user.model";
import path from "path";
import dotenv from "dotenv";

// Load env
const rootEnv = path.resolve(__dirname, "../../.env");
dotenv.config({ path: rootEnv });

// FORCE LOCALHOST FOR MONGO when running this script outside Docker
if (process.env.DATABASE_URI) {
  let uri = process.env.DATABASE_URI;
  if (uri.includes("mongodb://mongo:")) {
    uri = uri.replace("mongodb://mongo:", "mongodb://localhost:");
  } else if (uri.includes("mongodb://zuri_mongo:")) {
    uri = uri.replace("mongodb://zuri_mongo:", "mongodb://localhost:");
  }
  process.env.DATABASE_URI = uri;
  console.log(
    `🔌 Overriding Database Host to LOCALHOST for debug script: ${process.env.DATABASE_URI}`
  );
} else {
  process.env.DATABASE_URI = "mongodb://localhost:27017/zuridb";
  console.log(
    `🔌 Setting fallback Database Host to LOCALHOST: ${process.env.DATABASE_URI}`
  );
}

import connectDB from "../config/db.config";

async function main() {
  try {
    await connectDB();

    // Find existing users for refs
    const callingUser = await User.findOne();
    if (!callingUser) {
      console.error("No users found to create fake replacement");
      return;
    }

    // Create dummy replacement
    const mockRep = {
      id_saliente: callingUser._id,
      rut_saliente: callingUser.rut,
      nombre_saliente: "TestName",
      apellido_saliente: "TestLast",
      id_entrante: callingUser._id,
      rut_entrante: callingUser.rut,
      nombre_entrante: "TestEntrante",
      apellido_entrante: "TestEntranteLast",
      tipo_turno: "DIA",
      fecha_inicio: new Date(),
      fecha_termino: new Date(Date.now() + 3600000), // +1 hour
      servicio: "URGENCIA",
      creado_por: callingUser._id,
    };

    const savedRep = await replacementService.registrar(mockRep);
    console.log(`Created dummy replacement: ${savedRep._id}`);

    // Fetch Landing Page (VIEW) - NOT ICS
    const url = `http://localhost:3500/api/calendar/view/${savedRep._id}`;
    console.log(`Fetching: ${url}`);

    try {
      const res = await axios.get(url, { responseType: "text" });
      console.log("\n--- RESPONSE HEADERS ---");
      console.log(res.headers);
      console.log("\n--- RESPONSE BODY ---");
      console.log(res.data);
      console.log("---------------------\n");

      if (!res.data || res.data.length === 0) {
        console.error("❌ ERROR: Body is empty!");
      } else if (!res.data.includes("<!DOCTYPE html>")) {
        console.error(
          "❌ ERROR: Invalid HTML format! Got:",
          res.data.substring(0, 50)
        );
      } else {
        console.log("✅ HTML LANDING PAGE LOOKS VALID");
      }
    } catch (err: any) {
      console.error("❌ Request failed:", err.message);
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Data:", err.response.data);
      }
    }
  } catch (error) {
    console.error("Script error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

main();

import mongoose from "mongoose";
import dotenv from "dotenv";
import { getMonthlyReport } from "../services/report.service";
import User from "../models/user.model";
import Service from "../models/service.model";

// Load .env from server root (one level up from scripts/)
dotenv.config();

const MONGO_URI =
  process.env.DATABASE_URI || "mongodb://localhost:27017/zuri_db";

const runDebug = async () => {
  try {
    // Masked URI logging
    const urilog = MONGO_URI.replace(/:([^:@]+)@/, ":****@");
    console.log(`Connecting to: ${urilog}`);

    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Check TurnSigla definitions
    const { TurnSigla } = await import("../models/turn-sigla.model");
    const siglas = await TurnSigla.find({});
    console.log(
      "Found Siglas:",
      siglas.map((s) => ({
        sigla: s.sigla,
        hours: s.turno_entrada && s.turno_salida ? "calculated" : "null",
      })),
    );

    // Find User LUIS PALMA
    const user = await User.findOne({ nombre: /LUIS/i, apellido: /PALMA/i });
    if (!user) {
      console.log("User LUIS PALMA not found");
      return;
    }
    console.log(`Found User: ${user.nombre} ${user.apellido} (${user._id})`);

    // Check replacements
    const { default: Replacement } =
      await import("../models/replacement.model"); // Correct import for default export
    const replacements = await Replacement.find({ id_entrante: user._id });
    console.log(
      "User Replacements:",
      replacements.map((r) => ({
        id: r._id,
        servicio: r.servicio,
        tipo_turno: r.tipo_turno,
        start: r.fecha_inicio,
        end: r.fecha_termino,
      })),
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

runDebug();

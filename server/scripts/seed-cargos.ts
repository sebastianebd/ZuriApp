import mongoose from "mongoose";
import Position from "../models/position.model";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DATABASE_URI =
  process.env.DATABASE_URI || "mongodb://localhost:27017/zuri_db";

const DEFAULT_POSITIONS = [
  { name: "MEDICO", position_code: "MED" },
  { name: "ENFERMERA", position_code: "ENF" },
  { name: "MATRONA", position_code: "MAT" },
  { name: "TENS", position_code: "TNS" },
  { name: "AUXILIAR", position_code: "AUX" },
  { name: "ADMINISTRATIVO", position_code: "ADM" },
  { name: "KINESIOLOGO", position_code: "KIN" },
  { name: "NUTRICIONISTA", position_code: "NUT" },
  { name: "PSICOLOGO", position_code: "PSI" },
  { name: "TRABAJADOR SOCIAL", position_code: "TSO" }
];

async function seedCargos() {
  console.log("🌱 Iniciando seed de cargos (Positions)...");
  console.log(`📡 Conectando a: ${DATABASE_URI}`);

  try {
    await mongoose.connect(DATABASE_URI);
    console.log("✅ Conexión exitosa a MongoDB");

    for (const position of DEFAULT_POSITIONS) {
      const existing = await Position.findOne({ position_code: position.position_code });
      if (existing) {
        console.log(
          `⚠️  Cargo ${position.name} (${position.position_code}) ya existe.`
        );
      } else {
        await Position.create(position);
        console.log(`✨ Creado Cargo: ${position.name}`);
      }
    }

    console.log("✅ Seed de cargos completado exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante el seed de cargos:", error);
    process.exit(1);
  }
}

seedCargos();

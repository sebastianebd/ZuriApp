import mongoose from "mongoose";
import TurnType from "../models/turn-type.model";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DATABASE_URI =
  process.env.DATABASE_URI || "mongodb://localhost:27017/zuri_db";

const DEFAULT_TURN_TYPES = [
  {
    nombre: "TERCER TURNO",
    codigo: "3T",
    alias: "3T",
    jornada: "MIXTO",
    cantidad_dias: 4,
    secuencia: [
      { dia: 1, sigla: "L", turno_entrada: "08:00", turno_salida: "20:00" },
      { dia: 2, sigla: "N", turno_entrada: "20:00", turno_salida: "08:00" },
      { dia: 3, sigla: "L", es_libre: true }, // Libre
      { dia: 4, sigla: "L", es_libre: true }, // Libre
    ],
    activo: true,
  },
  {
    nombre: "CUARTO TURNO",
    codigo: "4T",
    alias: "4T",
    jornada: "MIXTO",
    cantidad_dias: 4,
    secuencia: [
      { dia: 1, sigla: "L", turno_entrada: "08:00", turno_salida: "20:00" },
      { dia: 2, sigla: "N", turno_entrada: "20:00", turno_salida: "08:00" },
      { dia: 3, sigla: "L", es_libre: true },
      { dia: 4, sigla: "L", es_libre: true },
    ],
    activo: true,
  },
  {
    nombre: "DIURNO",
    codigo: "D",
    alias: "D",
    jornada: "DIURNO",
    cantidad_dias: 7, // L-V
    secuencia: [
      { dia: 1, sigla: "D", turno_entrada: "08:00", turno_salida: "17:00" },
      { dia: 2, sigla: "D", turno_entrada: "08:00", turno_salida: "17:00" },
      { dia: 3, sigla: "D", turno_entrada: "08:00", turno_salida: "17:00" },
      { dia: 4, sigla: "D", turno_entrada: "08:00", turno_salida: "17:00" },
      { dia: 5, sigla: "D", turno_entrada: "08:00", turno_salida: "17:00" },
      { dia: 6, sigla: "L", es_libre: true },
      { dia: 7, sigla: "L", es_libre: true },
    ],
    activo: true,
  },
];

async function seedTurnTypes() {
  console.log("🌱 Iniciando seed de tipos de turnos...");
  console.log(`📡 Conectando a: ${DATABASE_URI}`);

  try {
    await mongoose.connect(DATABASE_URI);
    console.log("✅ Conexión exitosa a MongoDB");

    for (const type of DEFAULT_TURN_TYPES) {
      const existing = await TurnType.findOne({ codigo: type.codigo });
      if (existing) {
        console.log(
          `⚠️  Tipo Turno ${type.nombre} (${type.codigo}) ya existe.`,
        );
      } else {
        await TurnType.create(type);
        console.log(`✨ Creado Tipo Turno: ${type.nombre}`);
      }
    }

    console.log("✅ Seed de tipos de turnos completado exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante el seed de tipos de turnos:", error);
    process.exit(1);
  }
}

seedTurnTypes();

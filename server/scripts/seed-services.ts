import mongoose from "mongoose";
import Service from "../models/service.model";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DATABASE_URI =
  process.env.DATABASE_URI || "mongodb://localhost:27017/zuri_db";

const DEFAULT_SERVICES = [
  { nombre: "MATERNIDAD", codigo: "MAT" },
  { nombre: "RECIEN NACIDOS", codigo: "NEO" },
  { nombre: "PEDIATRIA", codigo: "PED" },
  { nombre: "IMAGENOLOGIA", codigo: "IMG" },
  { nombre: "FARMACIA", codigo: "FAR" },
  { nombre: "LABORATORIO", codigo: "LAB" },
  { nombre: "GINECOLOGIA", codigo: "GIN" },
  { nombre: "PUERPERIO", codigo: "PUE" },
  { nombre: "ARO", codigo: "ARO" },
  { nombre: "URGENCIA RESPIRATORIA", codigo: "URG" },
];

async function seedServices() {
  console.log("🌱 Iniciando seed de servicios...");
  console.log(`📡 Conectando a: ${DATABASE_URI}`);

  try {
    await mongoose.connect(DATABASE_URI);
    console.log("✅ Conexión exitosa a MongoDB");

    for (const service of DEFAULT_SERVICES) {
      const existing = await Service.findOne({ codigo: service.codigo });
      if (existing) {
        console.log(
          `⚠️  Servicio ${service.nombre} (${service.codigo}) ya existe.`,
        );
        // Optional: Update logic here if needed
      } else {
        await Service.create(service);
        console.log(`✨ Creado Servicio: ${service.nombre}`);
      }
    }

    console.log("✅ Seed de servicios completado exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante el seed de servicios:", error);
    process.exit(1);
  }
}

seedServices();

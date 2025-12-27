import mongoose from "mongoose";
import Option from "../models/option.model";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DATABASE_URI =
  process.env.DATABASE_URI || "mongodb://localhost:27017/zuri_db";

async function seedOptions() {
  console.log("🌱 Iniciando seed de opciones...");
  console.log(`📡 Conectando a: ${DATABASE_URI}`);

  try {
    await mongoose.connect(DATABASE_URI);
    console.log("✅ Conexión exitosa a MongoDB");

    const options = [
      {
        nombre: "TIPO_TURNO",
        opciones: ["TERCER TURNO", "CUARTO TURNO"],
      },
      {
        nombre: "HABILITADO",
        opciones: ["HABILITADO", "NO HABILITADO"],
      },
      {
        nombre: "TIPO_CARGO",
        opciones: ["TENS", "ENFERMERO", "MÉDICO"],
      },
      {
        nombre: "SERVICIOS",
        opciones: [
          "MATERNIDAD",
          "RECIEN NACIDOS",
          "PEDIATRIA",
          "IMAGENOLOGIA",
          "FARMACIA",
          "LABORATORIO",
          "GINECOLOGIA",
          "PUERPERIO",
          "ARO",
          "URGENCIA RESPIRATORIA",
        ],
      },
    ];

    for (const option of options) {
      const existing = await Option.findOne({ nombre: option.nombre });
      if (existing) {
        console.log(`⚠️  ${option.nombre} ya existe, actualizando...`);
        await Option.findOneAndUpdate(
          { nombre: option.nombre },
          { opciones: option.opciones }
        );
      } else {
        await Option.create(option);
        console.log(`✨ Creado: ${option.nombre}`);
      }
    }

    console.log("✅ Seed de opciones completado exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante el seed de opciones:", error);
    process.exit(1);
  }
}

seedOptions();

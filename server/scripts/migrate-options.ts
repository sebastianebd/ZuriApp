import mongoose from "mongoose";
import Option from "../models/option.model";
import Service from "../models/service.model";
import TurnType from "../models/turn-type.model";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DATABASE_URI =
  process.env.DATABASE_URI || "mongodb://localhost:27017/zuri_db";

async function migrateOptionsToCollections() {
  console.log("🚀 Iniciando migración de opciones...");
  console.log(`📡 Conectando a: ${DATABASE_URI}`);

  try {
    await mongoose.connect(DATABASE_URI);
    console.log("✅ Conectado a MongoDB");

    // 1. Migrate SERVICIOS
    const serviceOption = await Option.findOne({ nombre: "SERVICIOS" });
    if (serviceOption && serviceOption.opciones.length > 0) {
      console.log(
        `📋 Encontrados ${serviceOption.opciones.length} servicios para migrar.`
      );

      let createdCount = 0;
      for (const serviceName of serviceOption.opciones) {
        // Upsert based on name
        const exists = await Service.findOne({ nombre: serviceName });
        if (!exists) {
          await Service.create({ nombre: serviceName });
          createdCount++;
        }
      }
      console.log(`✅ Migrados ${createdCount} nuevos servicios.`);
    } else {
      console.log(
        "ℹ️ No se encontraron servicios en la colección Option ('SERVICIOS') o lista vacía."
      );
    }

    // 2. Migrate TIPO_TURNO
    const turnTypeOption = await Option.findOne({ nombre: "TIPO_TURNO" });
    if (turnTypeOption && turnTypeOption.opciones.length > 0) {
      console.log(
        `📋 Encontrados ${turnTypeOption.opciones.length} tipos de turno para migrar.`
      );

      let createdCount = 0;
      for (const turnName of turnTypeOption.opciones) {
        // Upsert based on name
        const exists = await TurnType.findOne({ nombre: turnName });
        if (!exists) {
          await TurnType.create({ nombre: turnName });
          createdCount++;
        }
      }
      console.log(`✅ Migrados ${createdCount} nuevos tipos de turno.`);
    } else {
      console.log(
        "ℹ️ No se encontraron tipos de turno en la colección Option ('TIPO_TURNO') o lista vacía."
      );
    }

    console.log("🎉 Migración completada exitosamente.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    process.exit(1);
  }
}

migrateOptionsToCollections();

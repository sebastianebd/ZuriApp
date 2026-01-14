import mongoose from "mongoose";
import Cargo from "../models/cargo.model";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DATABASE_URI =
  process.env.DATABASE_URI || "mongodb://localhost:27017/zuri_db";

const DEFAULT_CARGOS = [
  {
    nombre: "TENS",
    descripcion: "Técnico en Enfermería",
    nivel: 10,
    codigo: "TENS",
    permisos: ["ver.turnos"],
    activo: true,
  },
  {
    nombre: "ENFERMERO",
    descripcion: "Enfermero/a Universitario",
    nivel: 20,
    codigo: "ENF",
    permisos: ["ver.turnos", "gestionar.turnos"],
    activo: true,
  },
  {
    nombre: "MÉDICO",
    descripcion: "Médico Cirujano",
    nivel: 30,
    codigo: "MED",
    permisos: ["ver.turnos", "ver.reportes"],
    activo: true,
  },
  {
    nombre: "RECURSOS HUMANOS",
    descripcion: "Gestión de Personal",
    nivel: 90,
    codigo: "RRHH",
    permisos: [
      "ver.usuarios",
      "crear.usuarios",
      "editar.usuarios",
      "baja.usuarios",
      "ver.reemplazos",
      "crear.reemplazos",
      "editar.reemplazos",
      "eliminar.reemplazos",
      "ver.historial",
    ],
    activo: true,
  },
  {
    nombre: "ADMIN-TI",
    descripcion: "Administrador del Sistema",
    nivel: 100,
    codigo: "ADMIN",
    permisos: ["*"], // Super Admin
    activo: true,
  },
];

async function seedCargos() {
  console.log("🌱 Iniciando seed de cargos...");
  console.log(`📡 Conectando a: ${DATABASE_URI}`);

  try {
    await mongoose.connect(DATABASE_URI);
    console.log("✅ Conexión exitosa a MongoDB");

    for (const cargo of DEFAULT_CARGOS) {
      const existing = await Cargo.findOne({ codigo: cargo.codigo });
      if (existing) {
        console.log(`⚠️  Cargo ${cargo.nombre} (${cargo.codigo}) ya existe.`);
        // Optional: Update permissions if needed
        // await Cargo.updateOne({ _id: existing._id }, { permisos: cargo.permisos });
      } else {
        await Cargo.create(cargo);
        console.log(`✨ Creado Cargo: ${cargo.nombre}`);
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

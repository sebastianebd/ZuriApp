import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/user.model";
import dotenv from "dotenv";
import path from "path";

// Cargar variables de entorno desde .env (en root) o .env.development
// Intentamos cargar desde el directorio padre
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DATABASE_URI =
  process.env.DATABASE_URI || "mongodb://localhost:27017/zuri_db";

async function seed() {
  console.log("🌱 Iniciando proceso de Seed...");
  console.log(`📡 Conectando a: ${DATABASE_URI}`);

  try {
    await mongoose.connect(DATABASE_URI);
    console.log("✅ Conexión exitosa a MongoDB");

    // 1. Definir contraseña (sin encriptar manualmente, el modelo lo hace)
    const plainPassword = "2716xD!";

    // 2. Definir Usuario Admin
    const adminUser = {
      rut: "11752331-4",
      nombre: "Admin",
      apellido: "Secundario",
      fecha_nac: new Date("1990-01-01"),
      direccion: "Calle Falsa 123",
      telefono: "934768811",
      email: "admin@zuriapp.cl",
      ciudad: "Santiago",
      tipo_cargo: "ADMIN-TI",
      password: plainPassword,
      eliminado: false,
    };

    // 3. Verificar si existe
    const existingAdmin = await User.findOne({ email: adminUser.email });

    if (existingAdmin) {
      console.log("⚠️ El usuario Admin ya existe. No se realizaron cambios.");
    } else {
      const createdUser = await User.create(adminUser);
      console.log("Seed completado exitosamente!");
      console.log("Usuario creado:");
      console.log(`Email: ${createdUser.email}`);
      console.log(`Password: ${plainPassword}`);
      console.log(`RUT: ${createdUser.rut}`);
      console.log(`Cargo: ${createdUser.tipo_cargo}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante el Seed:", error);
    process.exit(1);
  }
}

seed();

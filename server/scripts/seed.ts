import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Staff from "../models/staff.model";
import Role from "../models/role.model";
import Account from "../models/account.model";
import Position from "../models/position.model";
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

    // 1.5 Definir Rol Admin (Nivel 100)
    const adminPermissions = [
      "users.view",
      "users.create",
      "users.update",
      "users.delete",
      "users.reset_password",
      "role.view",
      "role.create",
      "role.update",
      "role.delete",
      "position.view",
      "position.create",
      "position.update",
      "position.delete",
      "shifts.view",
      "shifts.create",
      "shifts.update",
      "shifts.delete",
      "replacement.view",
      "replacement.create",
      "replacement.update",
      "replacement.delete",
      "service.view",
      "service.create",
      "service.update",
      "service.delete",
      "turn-type.view",
      "turn-type.create",
      "turn-type.update",
      "turn-type.delete",
      "turn-sigla.view",
      "turn-sigla.create",
      "turn-sigla.update",
      "turn-sigla.delete",
      "audit.view",
    ];

    let adminRole = await Role.findOne({ level: 100 });
    if (!adminRole) {
      adminRole = await Role.create({
        name: "Administrador del Sistema",
        code: "SYS_ADMIN",
        level: 100,
        hasSystemAccess: true,
        permissions: adminPermissions,
      });
      console.log("✅ Rol Admin creado");
    } else {
      adminRole.permissions = adminPermissions;
      await adminRole.save();
      console.log("✅ Permisos del Rol Admin actualizados");
    }

    // 1.6 Definir Rol Usuario (Nivel 10)
    let userRole = await Role.findOne({ level: 10 });
    if (!userRole) {
      userRole = await Role.create({
        name: "Usuario Estándar",
        code: "USER",
        level: 10,
        hasSystemAccess: true,
        permissions: ["users.view"],
      });
      console.log("✅ Rol Usuario creado");
    }

    // 2. Definir y crear Position para el Admin
    let adminPosition = await Position.findOne({ position_code: "IT" });
    if (!adminPosition) {
      adminPosition = await Position.create({
        name: "INFORMATICA",
        position_code: "IT",
        description: "Departamento de Informática",
        isActive: true,
      });
      console.log("✅ Cargo Informatico creado");
    }

    // 3. Definir Staff Admin
    const adminStaff = {
      rut: "12345678-5",
      firstName: "Admin",
      lastName: "Principal",
      birthDate: new Date("1990-01-01"),
      address: "Calle Falsa 123",
      phone: "934768811",
      email: "admin@zuriapp.cl",
      city: "Santiago",
      roleId: adminRole._id,
      positionId: adminPosition._id,
      contractType: "CONTRATA",
      isDeleted: false,
      isActive: false,
    };

    // 3. Verificar si existe
    let existingStaff = await Staff.findOne({ email: adminStaff.email });

    if (existingStaff) {
      console.log("⚠️ El Staff Admin ya existe. No se realizaron cambios.");
    } else {
      existingStaff = await Staff.create(adminStaff);
      console.log("✅ Staff Admin creado");

      // 4. Crear Account para el Admin
      // Password hashing must be done here if the model doesn't automatically hash it on creation (wait, Account schema has select: false for password, we should hash it if pre-save hook doesn't exist. Let's just hash it here to be safe)
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      await Account.create({
        staffId: existingStaff._id,
        rut: existingStaff.rut,
        password: hashedPassword, // The schema usually hashes, but we force it or rely on pre('save') hook
        isActive: true, // admin is active immediately
      });

      console.log("Seed completado exitosamente!");
      console.log("Usuario creado:");
      console.log(`Email: ${existingStaff.email}`);
      console.log(`Password: ${plainPassword}`);
      console.log(`RUT: ${existingStaff.rut}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante el Seed:", error);
    process.exit(1);
  }
}

seed();

import mongoose from "mongoose";
import User from "../models/user.model";
import Cargo from "../models/cargo.model";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const run = async () => {
  try {
    let uri = process.env.DATABASE_URI || "mongodb://localhost:27017/zuriapp";
    if (uri.includes("//mongo")) uri = uri.replace("//mongo", "//localhost");
    uri = uri.replace(/['"]/g, "").trim();

    await mongoose.connect(uri);
    console.log("Connected to DB");

    // 1. Fetch all Cargos
    const cargos = await Cargo.find({});
    console.log("\n--- CARGOS DISPONIBLES ---");
    cargos.forEach((c) => {
      console.log(
        `Nombre: "${c.nombre}" | Nivel: ${c.nivel} | Permisos: ${c.permisos?.length}`
      );
    });

    // 2. Fetch Users that seem like Admins
    const users = await User.find({});
    console.log("\n--- USUARIOS (Muestra) ---");
    for (const u of users) {
      // Check if this user's cargo exists
      const match = cargos.find((c) => c.nombre === u.tipo_cargo);
      const status = match ? "✅ MATCH" : "❌ NO MATCH";

      if (!match || u.tipo_cargo.toUpperCase().includes("ADMIN")) {
        console.log(
          `User: ${u.nombre} ${u.apellido} | TipoCargo: "${u.tipo_cargo}" | ${status}`
        );
        if (match) {
          console.log(
            `   -> Nivel Cargo: ${match.nivel} | Permisos: ${match.permisos}`
          );
        }
      }
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();

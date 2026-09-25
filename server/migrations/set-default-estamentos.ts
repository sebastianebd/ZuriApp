/**
 * server/migrations/set-default-estamentos.ts
 *
 * Script de migración idempotente para asignar el campo 'estamento'
 * a todos los cargos (Position) existentes en la base de datos.
 */

import mongoose from "mongoose";
import Position, { IPosition } from "../models/position.model";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DATABASE_URI =
  process.env.DATABASE_URI || "mongodb://localhost:27017/zuri_db";

export function resolveEstamento(name: string, code: string): 'MEDICO' | 'PROFESIONAL' | 'TECNICO' | 'ADMINISTRATIVO' | 'AUXILIAR' {
  const upperName = (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  const upperCode = (code || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (upperName.includes("PARAMEDICO") || upperName.includes("TENS") || upperName.includes("TECNICO") || upperCode === "TNS" || upperCode === "TEC") {
    return "TECNICO";
  }
  if (upperName.includes("MEDICO") || upperCode === "MED") {
    return "MEDICO";
  }
  if (upperName.includes("AUXILIAR") || upperCode === "AUX") {
    return "AUXILIAR";
  }
  if (upperName.includes("ADMINISTRATIVO") || upperName.includes("SECRETARIA") || upperCode === "ADM" || upperCode === "SEC") {
    return "ADMINISTRATIVO";
  }
  return "PROFESIONAL";
}

export async function runEstamentosMigration(): Promise<{ updatedCount: number; totalCount: number }> {
  const positions = await Position.find({});
  let updatedCount = 0;

  for (const pos of positions) {
    if (!(pos as any).estamento || (pos as any).estamento === "PROFESIONAL") {
      const correctEstamento = resolveEstamento(pos.name, pos.position_code);
      if ((pos as any).estamento !== correctEstamento) {
        (pos as any).estamento = correctEstamento;
        await pos.save();
        updatedCount++;
      }
    }
  }

  return { updatedCount, totalCount: positions.length };
}

async function main() {
  console.log("🚀 Iniciando migración de estamentos en Positions...");
  console.log(`📡 Conectando a MongoDB: ${DATABASE_URI}`);

  try {
    await mongoose.connect(DATABASE_URI);
    console.log("✅ Conexión establecida");

    const result = await runEstamentosMigration();
    console.log(`🎉 Migración finalizada con éxito.`);
    console.log(`📊 Cargos evaluados: ${result.totalCount}, Actualizados: ${result.updatedCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error ejecutando migración:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

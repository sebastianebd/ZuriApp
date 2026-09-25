/**
 * server/migrations/fix-turn-assignment-end-date.ts
 *
 * Script de migración idempotente para asignar end_date a todas
 * las asignaciones históricas de cuadrante (TurnAssignment) que
 * tengan end_date: null o no definido ($exists: false).
 *
 * En la práctica hospitalaria los turnos se programan estrictamente
 * mes a mes, por lo que las asignaciones históricas huérfanas de término
 * se fijan al último día del mes correspondiente a su start_date.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DATABASE_URI =
  process.env.DATABASE_URI || "mongodb://localhost:27017/zuri_db";

/**
 * Calcula el final exacto de mes (23:59:59.999 UTC) para una fecha dada.
 */
export function calculateEndOfMonth(date: Date): Date {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  // Día 0 del mes siguiente representa el último día del mes actual en UTC
  return new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
}

/**
 * Ejecuta la migración de forma directa e idempotente.
 * Usa la colección de MongoDB directamente para operar sin restricciones
 * de esquemas durante el backfill de registros incompletos.
 */
export async function runFixEndDateMigration(): Promise<{ updatedCount: number; totalCount: number }> {
  const collection = mongoose.connection.collection("turnassignments");

  const query = {
    $or: [{ end_date: null }, { end_date: { $exists: false } }],
  };

  const pendingAssignments = await collection.find(query).toArray();
  let updatedCount = 0;

  for (const doc of pendingAssignments) {
    if (doc.start_date) {
      const computedEndDate = calculateEndOfMonth(doc.start_date);
      await collection.updateOne(
        { _id: doc._id },
        { $set: { end_date: computedEndDate } }
      );
      updatedCount++;
    }
  }

  return {
    updatedCount,
    totalCount: pendingAssignments.length,
  };
}

async function main() {
  console.log("🚀 Iniciando migración fix-turn-assignment-end-date...");
  console.log(`📡 Conectando a MongoDB: ${DATABASE_URI}`);

  try {
    await mongoose.connect(DATABASE_URI);
    console.log("✅ Conexión establecida");

    const result = await runFixEndDateMigration();
    console.log("🎉 Migración finalizada con éxito.");
    console.log(
      `📊 Registros pendientes encontrados: ${result.totalCount}, Actualizados: ${result.updatedCount}`
    );

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

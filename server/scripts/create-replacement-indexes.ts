import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const DATABASE_URI = process.env.DATABASE_URI;

if (!DATABASE_URI) {
  console.error("❌ DATABASE_URI not found in .env file");
  process.exit(1);
}

mongoose
  .connect(DATABASE_URI as string)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      console.error("❌ Database connection not established");
      process.exit(1);
    }

    const collection = db.collection("reemplazos");

    console.log("📊 Creating indexes for 'reemplazos' collection...");

    // Index for status filtering (most common query)
    await collection.createIndex({ status: 1 });
    console.log("✅ Index created: { status: 1 }");

    // Index for service filtering
    await collection.createIndex({ servicio: 1 });
    console.log("✅ Index created: { servicio: 1 }");

    // Index for RUT searches (saliente and entrante)
    await collection.createIndex({ rut_saliente: 1 });
    console.log("✅ Index created: { rut_saliente: 1 }");

    await collection.createIndex({ rut_entrante: 1 });
    console.log("✅ Index created: { rut_entrante: 1 }");

    // Index for name searches (saliente and entrante)
    await collection.createIndex({ nombre_saliente: 1 });
    console.log("✅ Index created: { nombre_saliente: 1 }");

    await collection.createIndex({ apellido_saliente: 1 });
    console.log("✅ Index created: { apellido_saliente: 1 }");

    await collection.createIndex({ nombre_entrante: 1 });
    console.log("✅ Index created: { nombre_entrante: 1 }");

    await collection.createIndex({ apellido_entrante: 1 });
    console.log("✅ Index created: { apellido_entrante: 1 }");

    // Compound index for active replacements (status + date range queries)
    await collection.createIndex({ status: 1, fecha_inicio: -1 });
    console.log("✅ Index created: { status: 1, fecha_inicio: -1 }");

    // Compound index for service + status filtering
    await collection.createIndex({ servicio: 1, status: 1 });
    console.log("✅ Index created: { servicio: 1, status: 1 }");

    console.log("✅ All indexes created successfully!");

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

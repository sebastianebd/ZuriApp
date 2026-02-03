import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from project root/.env
const envPath = path.resolve(__dirname, "..", "..", ".env");
dotenv.config({ path: envPath });

const DATABASE_URI = process.env.DATABASE_URI;

if (!DATABASE_URI) {
  console.error("❌ Error: DATABASE_URI not found in .env file");
  console.error(`   Looked for .env at: ${envPath}`);
  process.exit(1);
}

async function createUserIndexes() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(DATABASE_URI as string);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    const usersCollection = db.collection("users");

    console.log("\n📊 Creating indexes for users collection...\n");

    // Index 1: RUT (unique, for fast lookups)
    await usersCollection.createIndex({ rut: 1 }, { unique: true });
    console.log("✅ Created index: { rut: 1 } (unique)");

    // Index 2: Nombre + Apellido (for search queries)
    await usersCollection.createIndex({ nombre: 1, apellido: 1 });
    console.log("✅ Created index: { nombre: 1, apellido: 1 }");

    // Index 3: Tipo Cargo + Eliminado (for filtered queries)
    await usersCollection.createIndex({ tipo_cargo: 1, eliminado: 1 });
    console.log("✅ Created index: { tipo_cargo: 1, eliminado: 1 }");

    // Index 4: Email (unique, for authentication)
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    console.log("✅ Created index: { email: 1 } (unique)");

    // Index 5: Telefono (unique, for validation)
    await usersCollection.createIndex({ telefono: 1 }, { unique: true });
    console.log("✅ Created index: { telefono: 1 } (unique)");

    console.log("\n📋 Listing all indexes:");
    const indexes = await usersCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(
        `${i + 1}. ${JSON.stringify(index.key)} ${index.unique ? "(unique)" : ""}`,
      );
    });

    console.log("\n✅ All indexes created successfully!");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

createUserIndexes();

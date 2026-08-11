import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

let replSet: MongoMemoryReplSet;

/**
 * Conecta a la base de datos en memoria (Replica Set requerido para Transacciones)
 */
export const connect = async () => {
  // MongoDB Transactions require a replica set.
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
  await mongoose.disconnect(); // Asegurar que no hay conexiones previas
  await mongoose.connect(uri);
};

/**
 * Desconecta y detiene el servidor de la base de datos
 */
export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await replSet.stop();
};

/**
 * Limpia todas las colecciones entre pruebas
 */
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

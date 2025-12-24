import { MongoMemoryServer } from "mongodb-memory-server";

(async () => {
  try {
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: "zuri",
      },
    });

    console.log("✅ MongoMemoryServer started");
    console.log("URI:", mongod.getUri());

    // Keep the process alive
    process.stdin.resume();
  } catch (err) {
    console.error("Failed to start MongoMemoryServer", err);
    process.exit(1);
  }
})();

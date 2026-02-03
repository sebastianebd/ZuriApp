import mongoose from "mongoose";
import Cargo from "../models/cargo.model";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MAPPINGS: Record<string, string[]> = {
  "users.manage": [
    "users.view",
    "users.create",
    "users.update",
    "users.delete",
  ],
  "cargos.manage": [
    "cargos.view",
    "cargos.create",
    "cargos.update",
    "cargos.delete",
  ],
  "shifts.manage": [
    "shifts.view",
    "shifts.create",
    "shifts.update",
    "shifts.delete",
  ],
  "replacement.manage": [
    "replacement.view",
    "replacement.create",
    "replacement.update",
    "replacement.delete",
  ],
  "config.manage": [
    "config.view",
    "config.create",
    "config.update",
    "config.delete",
  ],
};

const run = async () => {
  try {
    let uri = process.env.DATABASE_URI || "mongodb://localhost:27017/zuriapp";
    if (uri.includes("//mongo")) uri = uri.replace("//mongo", "//localhost");
    uri = uri.replace(/['"]/g, "").trim();

    await mongoose.connect(uri);
    console.log("Connected to DB");

    const cargos = await Cargo.find({});
    console.log(`Found ${cargos.length} cargos.`);

    for (const cargo of cargos) {
      const oldPerms = cargo.permisos || [];
      let newPerms = new Set<string>();

      oldPerms.forEach((p) => {
        if (MAPPINGS[p]) {
          MAPPINGS[p].forEach((np) => newPerms.add(np));
        } else {
          newPerms.add(p); // Keep existing if no mapping (e.g. audit.view)
        }
      });

      // Ensure integrity: if create/update/delete present, ensure view is present
      ["users", "cargos", "shifts", "replacement", "config"].forEach((mod) => {
        const hasAction = Array.from(newPerms).some(
          (p) => p.startsWith(mod + ".") && p !== mod + ".view"
        );
        if (hasAction) newPerms.add(`${mod}.view`);
      });

      // Update
      cargo.permisos = Array.from(newPerms);
      await cargo.save();
      console.log(
        `Updated ${cargo.nombre}: ${cargo.permisos.length} permissions.`
      );
    }

    console.log("Migration Complete.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();

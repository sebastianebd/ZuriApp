import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../../.env") });

import mongoose from "mongoose";
import { reportClosureQueue } from "../queues/report.queue";
import Period from "../models/period.model";
import dayjs from "dayjs";

const run = async () => {
  try {
    const mongoUri =
      process.env.DATABASE_URI ||
      process.env.MONGO_URI ||
      "mongodb://mongo:27017/zuriapp";
    console.log(`1. Conectando a MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("2. MongoDB conectado.");

    // Probaremos con el mes actual (mes en curso) en vez del mes pasado,
    // ya que en tu base de datos seguramente tienes turnos ingresados en este mes.
    const targetMonth = dayjs();
    const month = targetMonth.month() + 1;
    const year = targetMonth.year();

    console.log(`3. Verificando el estado del periodo ${month}/${year}...`);
    const period = await Period.findOne({ month, year });
    if (period && period.status === "CLOSED") {
      console.log(
        `⚠️ El periodo estaba CERRADO. Reabriéndolo para la prueba...`,
      );
      period.status = "OPEN";
      await period.save();
    }

    console.log(`4. Encolando job de cierre para: ${month}/${year}`);

    const job = await reportClosureQueue.add("monthly-closure", {
      month,
      year,
    });

    console.log(`5. Job [${job.id}] encolado exitosamente.`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

run();

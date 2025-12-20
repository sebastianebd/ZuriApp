import dotenv from "dotenv";
dotenv.config();

export default {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 3500,
  DATABASE_URI: process.env.DATABASE_URI as string,
};

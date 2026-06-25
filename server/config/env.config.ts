import dotenv from "dotenv";
// Carga de Variables de Entorno
// Se invoca tempranamente para asegurar que process.env esté poblado antes de cualquier otra importación.
dotenv.config();

// Abstracción de Configuración
// Centraliza el acceso a variables críticas, permitiendo validación (futura) y tipado,
// evitando el uso disperso de 'process.env' en toda la aplicación.
export default {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 3500,
  DATABASE_URI: process.env.DATABASE_URI as string,
};

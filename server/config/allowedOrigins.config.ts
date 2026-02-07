const allowedOrigins: string[] = [
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "http://localhost:8080",
];

// Inyección de Origen Dinámico
// Permite agregar orígenes confiables adicionales (e.g., URL del cliente en producción)
// sin modificar el código fuente, facilitando despliegues en múltiples entornos (Staging, Prod).
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

export default allowedOrigins;

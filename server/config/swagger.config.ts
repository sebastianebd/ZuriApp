import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

// Configuración de OpenAPI 3.0 (Swagger)
// Define la estructura base de la documentación viva de la API.
// Utiliza JSDoc en los controladores y rutas para generar la especificación final.
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ZuriApp API",
      version: "1.0.0",
      description:
        "Documentación de la API para ZuriApp (Gestión de Reemplazos)",
      contact: {
        name: "Soporte ZuriApp",
      },
    },
    servers: [
      {
        url: "http://localhost:3500/api",
        description: "Servidor de Desarrollo",
      },
      // TODO: Agregar servidor de Producción/Staging cuando esté disponible
    ],
    components: {
      // Definición de Esquemas de Seguridad Reutilizables
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "jwt", // Nombre de la cookie que contiene el token
        },
      },
    },
    // Seguridad Global
    // Aplica cookieAuth a todos los endpoints por defecto, salvo que se sobrescriba.
    security: [{ cookieAuth: [] }],
  },
  // Descubrimiento de Documentación
  // Escanea rutas y modelos buscando anotaciones @swagger / @openapi
  apis: [
    path.join(__dirname, "../routes/api/*.ts"),
    path.join(__dirname, "../models/*.ts"),
  ],
};

const specs = swaggerJsdoc(options);
export default specs;

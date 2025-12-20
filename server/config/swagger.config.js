const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const options = {
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
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "jwt",
        },
      },
    },
    // Aplicar seguridad globalmente si se desea, o por ruta
    security: [{ cookieAuth: [] }],
  },
  // Rutas a los archivos que contienen anotaciones
  // Usamos path.resolve para asegurar que encuentre los archivos independientemente de dnde se ejecute el proceso
  apis: [
    path.join(__dirname, "../routes/api/*.js"),
    path.join(__dirname, "../models/*.js"),
  ],
};

const specs = swaggerJsdoc(options);
module.exports = specs;

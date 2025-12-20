import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

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
    security: [{ cookieAuth: [] }],
  },
  apis: [
    path.join(__dirname, "../routes/api/*.ts"),
    path.join(__dirname, "../models/*.ts"),
  ],
};

const specs = swaggerJsdoc(options);
export default specs;

import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Token Tracker API",
      version: "1.0.0",
      description: "REST API for a real-time multi-chain ERC-20 token indexer",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Local development",
      },
    ],
  },
  // Relative to process.cwd(). In dev: packages/api. In Docker: /app/packages/api.
  // Source .ts files are copied to src/routes/ in the Docker image for swagger-jsdoc to read.
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

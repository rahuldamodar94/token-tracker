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
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

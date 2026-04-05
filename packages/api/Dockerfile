FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/

RUN npm install

COPY packages/shared ./packages/shared
COPY packages/api ./packages/api

RUN npx tsc -p packages/shared/tsconfig.json
RUN npx tsc -p packages/api/tsconfig.json

# Production stage
FROM node:24-alpine

WORKDIR /app

COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/

RUN npm install --omit=dev

# Copy compiled output
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist
# Copy migrations
COPY --from=builder /app/packages/shared/migrations ./packages/shared/migrations

# Copy route source files for swagger-jsdoc (reads JSDoc annotations at runtime)
COPY --from=builder /app/packages/api/src/routes ./packages/api/src/routes

# Point shared package to compiled output
RUN sed -i 's|"main": "src/index.ts"|"main": "dist/index.js"|' packages/shared/package.json

WORKDIR /app/packages/api

EXPOSE 4000

CMD ["node", "dist/index.js"]

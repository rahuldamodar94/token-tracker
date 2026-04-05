FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/indexer/package.json ./packages/indexer/

RUN npm install

COPY packages/shared ./packages/shared
COPY packages/indexer ./packages/indexer

RUN npx tsc -p packages/shared/tsconfig.json
RUN npx tsc -p packages/indexer/tsconfig.json

# Production stage
FROM node:24-alpine

WORKDIR /app

COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/indexer/package.json ./packages/indexer/

RUN npm install --omit=dev

# Copy compiled output
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/indexer/dist ./packages/indexer/dist

# Point shared package to compiled output
RUN sed -i 's|"main": "src/index.ts"|"main": "dist/index.js"|' packages/shared/package.json

WORKDIR /app/packages/indexer

CMD ["node", "dist/index.js"]

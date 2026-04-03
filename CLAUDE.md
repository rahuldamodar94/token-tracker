# Token Tracker

Real-time multi-chain ERC-20 token indexer with spam detection.

## Build and Run

- Install: `npm install` (from root — npm workspaces)
- Start Docker services: `docker compose up -d` (Postgres, Redis, Kafka, Zookeeper)
- Run indexer: `cd packages/indexer && npx ts-node src/index.ts`
- Run API: `cd packages/api && npx ts-node src/index.ts`
- Migrations: `cd packages/shared && npm run migrate:up`
- Create migration: `cd packages/shared && npm run migrate:create -- <name>`
- Connect to DB: `psql -h localhost -p 5555 -U tokenscope -d tokenscope`

## Architecture

Monorepo with npm workspaces. Three packages:

- `packages/shared` (`@token-tracker/shared`) — DB pool, Redis client, Kafka instance, types, config, migrations
- `packages/indexer` (`@token-tracker/indexer`) — Block poller, Kafka producer/consumer, transfer scanner, token discovery, spam detection
- `packages/api` (`@token-tracker/api`) — Express 5 REST API with Zod validation, pagination, error handling

Indexer and API are separate processes. Indexer watches the chain and stores data. API serves data.

## Tech Stack

- TypeScript, Node.js, Express
- PostgreSQL (port 5555 via Docker), Redis (port 6666 via Docker), Kafka (port 9092 via Docker)
- ethers.js for blockchain interaction (JSON-RPC via Alchemy)
- KafkaJS for event pipeline, BullMQ for job queues
- node-pg-migrate for database migrations (CommonJS format with exports.up/exports.down)
- Zod for request validation, cors, helmet

## Code Conventions

- Import from shared package: `import { pool, config, kafka } from "@token-tracker/shared"`
- Use `exports.up`/`exports.down` in migrations (CommonJS, not ES modules)
- PostgreSQL BIGINT returns as string from pg driver — always `parseInt(value, 10)` when reading block numbers
- CHAR(66) for block/tx hashes, CHAR(42) for addresses, NUMERIC for token values
- Composite primary keys: (chain_id, block_number) for blocks, (chain_id, contract_address) for tokens
- chain_id is baked into every table, every query, every API route
- No ORMs — raw SQL via pg pool with parameterized queries
- Console.log for now — Winston structured logging will be added later
- API follows controller → repository pattern (no service layer)
- Zod schemas validate params/query in middleware, transformed values stored on `req.validated.params` / `req.validated.query` (body stays on `req.body`)
- Schemas use `.transform(Number)` for coercion — no `parseInt()` or type casts in controllers
- Exported types (`ChainIdParams`, `PaginationQuery`, etc.) from schema files via `z.infer` — controllers import and cast with `as Type`
- Pagination enforces bounds: page >= 1, limit 1–100
- Express 5 catches async errors automatically — no try/catch or next() needed in controllers
- `sendSuccess()` helper for consistent response format
- Shared interfaces (PaginationParams, PaginationMeta) live in `@token-tracker/shared` types
- PaginationMeta includes: page, limit, total, totalPages, hasNextPage
- Supported chain IDs validated via Zod enum (currently 1 and 137)

## Database Schema

- `blocks`: block_number (BIGINT), chain_id, block_hash, parent_hash, status (provisional/confirmed)
- `tokens`: contract_address, chain_id, name, symbol, decimals, spam_score, status (pending/active/rejected), discovered_at_block
- `transfers`: id (UUID), chain_id, token_address, from/to_address, value (NUMERIC), tx_hash, block_number, log_index

## Data Flow

Block Poller (ethers.js) → Kafka (block-events topic) → Block Processor (stores blocks) → Transfer Scanner (eth_getLogs) → Token Discovery (BullMQ workers) → Spam Scorer → PostgreSQL → Express API

## Key Design Decisions

- Kafka for block event pipeline (decoupling, backpressure, replay capability)
- BullMQ for token discovery jobs (retry with backoff, one-time tasks)
- Blocks stored as "provisional" until 64 confirmations (reorg safety)
- Reorg detection via parentHash verification on every new block
- ON CONFLICT DO NOTHING for idempotent inserts
- UNIQUE(chain_id, tx_hash, log_index) prevents duplicate transfer events

## Current Status

- Block poller → Kafka → Block processor pipeline: WORKING
- Transfer scanner: WORKING
- Token discovery (BullMQ): WORKING
- Spam detection: WORKING
- REST API with pagination: WORKING
- Remaining: Reorg rollback logic
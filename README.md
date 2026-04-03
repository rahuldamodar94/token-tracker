# Token Tracker

Real-time multi-chain ERC-20 token indexer with spam detection. Polls blocks from Ethereum (or any EVM chain), streams events through Kafka, discovers tokens, scores them for spam, and serves the indexed data through a REST API.

Built as a production-style backend system: event-driven architecture, idempotent writes, reorg-safe block tracking, and a clean separation between ingestion and serving layers.

## Architecture

```
                         ┌─────────────────────────────────────────────────────┐
                         │                    Indexer Process                   │
                         │                                                     │
  Ethereum RPC           │   ┌──────────────┐       ┌──────────────────────┐   │
  (Alchemy)              │   │  Block Poller │──────▶│   Kafka Producer     │   │
       ▲                 │   │  (ethers.js)  │       │   topic: block-events│   │
       │                 │   └──────────────┘       └──────────┬───────────┘   │
       │                 │                                      │              │
       │                 │                              ┌───────▼───────┐      │
       │                 │                              │    Kafka      │      │
       │                 │                              │    Broker     │      │
       │                 │                              └───────┬───────┘      │
       │                 │                                      │              │
       │                 │   ┌──────────────────┐      ┌───────▼───────┐      │
       │                 │   │ Transfer Scanner  │◀─────│Block Processor│      │
       │                 │   │  (eth_getLogs)    │      │  (Consumer)   │      │
       ├─────────────────│───┤                  │      └───────┬───────┘      │
                         │   └────────┬─────────┘              │              │
                         │            │                        │              │
                         │   ┌────────▼─────────┐              │              │
                         │   │ Token Discovery   │              │              │
                         │   │ (BullMQ Workers)  │              │              │
                         │   └────────┬─────────┘              │              │
                         │            │                        │              │
                         │   ┌────────▼─────────┐              │              │
                         │   │  Spam Scorer      │              │              │
                         │   └────────┬─────────┘              │              │
                         │            │                        │              │
                         └────────────┼────────────────────────┼──────────────┘
                                      │                        │
                              ┌───────▼────────────────────────▼───────┐
                              │              PostgreSQL                 │
                              │   blocks ─ tokens ─ transfers          │
                              └───────────────────┬────────────────────┘
                                                  │
                         ┌────────────────────────┼────────────────────────┐
                         │               API Process                       │
                         │                        │                        │
                         │              ┌─────────▼──────────┐             │
                         │              │   Express REST API  │             │
                         │              └────────────────────┘             │
                         └─────────────────────────────────────────────────┘
```

**Why this architecture?**

- **Kafka** decouples block ingestion from processing — gives backpressure handling, replay capability, and independent scaling of producers and consumers.
- **BullMQ** handles token discovery as one-time jobs with retry and exponential backoff, separate from the hot path of block processing.
- **Separate processes** for indexing and serving means the API never competes with the indexer for resources.

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Language       | TypeScript, Node.js                 |
| Blockchain     | ethers.js v6 (JSON-RPC via Alchemy) |
| Streaming      | Apache Kafka (KafkaJS)              |
| Job Queue      | BullMQ (backed by Redis)            |
| Database       | PostgreSQL 16                       |
| Cache          | Redis 7                             |
| API            | Express 5                           |
| Validation     | Zod                                 |
| Migrations     | node-pg-migrate                     |
| Infrastructure | Docker Compose                      |

## Project Structure

```
token-tracker/
├── docker-compose.yml
├── packages/
│   ├── shared/          @token-tracker/shared
│   │   ├── src/
│   │   │   ├── config.ts        Environment & config loader
│   │   │   ├── db.ts            PostgreSQL connection pool
│   │   │   ├── kafka.ts         Kafka client
│   │   │   ├── redis.ts         Redis client
│   │   │   ├── types.ts         Shared interfaces
│   │   │   └── index.ts         Barrel export
│   │   └── migrations/          SQL migrations (node-pg-migrate)
│   ├── indexer/         @token-tracker/indexer
│   │   └── src/
│   │       ├── index.ts          Entry point
│   │       ├── block-poller.ts   Polls chain for new blocks
│   │       ├── kafka-producer.ts Publishes block events to Kafka
│   │       ├── block-processor.ts Consumes events, writes to DB
│   │       └── provider.ts       ethers.js JSON-RPC provider
│   └── api/             @token-tracker/api
│       └── src/
│           ├── index.ts          Entry point
│           ├── app.ts            Express app setup (cors, helmet, routes)
│           ├── controllers/      Request handlers (tokens.ts)
│           ├── middleware/        Zod validation, error handler
│           ├── repositories/     Database queries (tokens.ts)
│           ├── routes/           Route definitions (tokens.ts)
│           ├── schema/           Zod schemas (tokens.ts)
│           └── utils/            Response helpers, error classes
```

Monorepo managed with npm workspaces. The shared package is consumed by both the indexer and API via `@token-tracker/shared`.

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker and Docker Compose
- An [Alchemy](https://www.alchemy.com/) API key (free tier works)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/token-tracker.git
cd token-tracker

# Copy environment variables
cp .env.example .env
# Edit .env and add your ALCHEMY_API_KEY

# Start infrastructure (Postgres, Redis, Kafka, Zookeeper)
docker compose up -d

# Install dependencies
npm install

# Run database migrations
cd packages/shared && npm run migrate:up && cd ../..
```

### Run

```bash
# Start the indexer
cd packages/indexer && npx ts-node src/index.ts

# Start the API (separate terminal)
cd packages/api && npx ts-node src/index.ts
```

The indexer will connect to the database, Kafka, and start polling blocks from the configured `START_BLOCK`. You should see output like:

```
Starting Token Tracker Indexer...
Database connection successful
Kafka producer connected
Block processor connected to Kafka and subscribed to block-events topic
Starting block polling from block number: 24789700
Published block 24789701 to Kafka
Stored block 24789701 in database
```

### Environment Variables

| Variable         | Description                     | Default                                                     |
|------------------|---------------------------------|-------------------------------------------------------------|
| `DATABASE_URL`   | PostgreSQL connection string    | `postgresql://tokenscope:tokenscope@localhost:5555/tokenscope` |
| `REDIS_URL`      | Redis connection string         | `redis://localhost:6666`                                    |
| `KAFKA_BROKERS`  | Comma-separated broker list     | `localhost:9092`                                            |
| `ALCHEMY_API_KEY`| Alchemy API key                 | —                                                           |
| `CHAIN_ID`       | EVM chain ID to index           | `1` (Ethereum mainnet)                                      |
| `START_BLOCK`    | Block number to start indexing  | `0`                                                         |
| `PORT`           | API server port                 | `4000`                                                      |
| `NODE_ENV`       | Environment                     | `development`                                               |

## Database Schema

Three tables, all scoped by `chain_id` for multi-chain support.

### `blocks`

Tracks every indexed block. Blocks start as `provisional` and are promoted to `confirmed` after 64 confirmations (reorg safety window).

| Column         | Type         | Notes                               |
|----------------|--------------|--------------------------------------|
| `block_number` | `BIGINT`     | PK (composite)                       |
| `chain_id`     | `INT`        | PK (composite)                       |
| `block_hash`   | `CHAR(66)`   | `0x`-prefixed, 32-byte hash          |
| `parent_hash`  | `CHAR(66)`   | Used for reorg detection             |
| `status`       | `VARCHAR(20)`| `provisional` or `confirmed`         |
| `indexed_at`   | `TIMESTAMPTZ`| When the block was indexed           |

### `tokens`

Discovered ERC-20 contracts. Each token goes through a lifecycle: `pending` → `active` or `rejected` based on spam scoring.

| Column               | Type         | Notes                               |
|----------------------|--------------|--------------------------------------|
| `contract_address`   | `CHAR(42)`   | PK (composite)                       |
| `chain_id`           | `INT`        | PK (composite)                       |
| `name`               | `VARCHAR(255)`| From on-chain `name()` call         |
| `symbol`             | `VARCHAR(50)` | From on-chain `symbol()` call       |
| `decimals`           | `INT`        | From on-chain `decimals()` call      |
| `spam_score`         | `INT`        | 0–100, higher = more likely spam     |
| `status`             | `VARCHAR(20)`| `pending`, `active`, or `rejected`   |
| `discovered_at_block`| `BIGINT`     | First block where token was seen     |
| `created_at`         | `TIMESTAMPTZ`|                                      |
| `updated_at`         | `TIMESTAMPTZ`|                                      |

### `transfers`

Every ERC-20 `Transfer` event log. Uniquely identified by the combination of chain, transaction, and log index.

| Column          | Type         | Notes                                        |
|-----------------|--------------|----------------------------------------------|
| `id`            | `UUID`       | PK, auto-generated                            |
| `chain_id`      | `INT`        | Part of unique constraint                     |
| `token_address` | `CHAR(42)`   | Contract that emitted the event               |
| `from_address`  | `CHAR(42)`   |                                               |
| `to_address`    | `CHAR(42)`   |                                               |
| `value`         | `NUMERIC`    | Raw token value (arbitrary precision)          |
| `tx_hash`       | `CHAR(66)`   | Part of unique constraint                     |
| `block_number`  | `BIGINT`     |                                               |
| `log_index`     | `INT`        | Part of unique constraint                     |
| `created_at`    | `TIMESTAMPTZ`|                                               |

**Indexes:** `(chain_id, token_address)`, `block_number`, `from_address`, `to_address`
**Unique constraint:** `(chain_id, tx_hash, log_index)` — prevents duplicate event ingestion

## API Endpoints

Base URL: `http://localhost:4000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tokens` | All tokens (paginated) |
| `GET` | `/api/tokens/:chainId` | Tokens by chain (paginated) |
| `GET` | `/api/tokens/:chainId/:address` | Single token |
| `GET` | `/api/tokens/:chainId/:address/transfers` | Token transfers (paginated) |

**Pagination query params** (available on paginated endpoints):

| Param   | Default | Description                        |
|---------|---------|------------------------------------|
| `page`  | `1`     | Page number (min: 1)               |
| `limit` | `20`    | Items per page (min: 1, max: 100)  |
| `sort`  | `desc`  | Sort order (`asc` or `desc`)       |

**Example response:**

```json
{
  "data": [...],
  "message": "Tokens fetched successfully",
  "error": null,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 95,
    "totalPages": 5,
    "hasNextPage": true
  }
}
```

Supported chain IDs: `1` (Ethereum), `137` (Polygon). Invalid chain IDs return a validation error.

## Design Decisions

- **Idempotent writes everywhere.** `ON CONFLICT DO NOTHING` on blocks, unique constraints on transfers. Safe to replay Kafka topics or reprocess blocks without data corruption.
- **Provisional block tracking.** New blocks are stored as `provisional` and only confirmed after 64 blocks. If a reorg is detected via `parent_hash` mismatch, affected blocks and their transfers can be rolled back.
- **Kafka over direct processing.** The block poller doesn't write to the database. It publishes to Kafka, and a separate consumer handles persistence. This means we can independently scale consumers, replay events from any offset, and add new downstream processors without touching the poller.
- **BullMQ for token discovery.** Token metadata resolution (`name()`, `symbol()`, `decimals()`) involves RPC calls that can fail or rate-limit. BullMQ gives us per-job retries with exponential backoff, concurrency control, and dead-letter handling — without complicating the main indexing pipeline.
- **No ORM.** Raw parameterized SQL via `pg`. Full control over queries, no magic, no abstraction leaks. Every query is visible and auditable.
- **Multi-chain from day one.** `chain_id` is baked into every table, every composite key, and every query. Adding a new chain is a config change, not a schema migration.

## Current Status

- [x] Monorepo structure with npm workspaces
- [x] Docker Compose infrastructure (Postgres, Redis, Kafka)
- [x] Database schema and migrations
- [x] Block poller with adaptive polling
- [x] Kafka producer/consumer pipeline
- [x] Block processor with idempotent writes
- [x] Transfer scanner (`eth_getLogs` integration)
- [x] Token discovery workers (BullMQ)
- [x] Spam detection scoring
- [x] REST API with Zod validation and pagination
- [ ] Reorg detection and rollback

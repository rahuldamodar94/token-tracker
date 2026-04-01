exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("transfers", {
    id: { type: "UUID", notNull: true, default: pgm.func("gen_random_uuid()"), primaryKey: true },
    chain_id: { type: "INT", notNull: true },
    token_address: { type: "CHAR(42)", notNull: true },
    from_address: { type: "CHAR(42)", notNull: true },
    to_address: { type: "CHAR(42)", notNull: true },
    value: { type: "NUMERIC", notNull: true },
    tx_hash: { type: "CHAR(66)", notNull: true },
    block_number: { type: "BIGINT", notNull: true },
    log_index: { type: "INT", notNull: true },
    created_at: { type: "TIMESTAMPTZ", notNull: true, default: pgm.func("NOW()") },
  });

  pgm.addConstraint("transfers", "transfers_unique_event", {
    unique: ["chain_id", "tx_hash", "log_index"],
  });

  pgm.createIndex("transfers", ["chain_id", "token_address"]);
  pgm.createIndex("transfers", "block_number");
  pgm.createIndex("transfers", "from_address");
  pgm.createIndex("transfers", "to_address");
};

exports.down = (pgm) => {
  pgm.dropTable("transfers");
};
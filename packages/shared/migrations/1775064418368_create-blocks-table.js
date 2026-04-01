exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("blocks", {
    block_number: { type: "BIGINT", notNull: true },
    chain_id: { type: "INT", notNull: true },
    block_hash: { type: "CHAR(66)", notNull: true },
    parent_hash: { type: "CHAR(66)", notNull: true },
    status: { type: "VARCHAR(20)", notNull: true, default: "provisional" },
    indexed_at: { type: "TIMESTAMPTZ", notNull: true, default: pgm.func("NOW()") },
  });

  pgm.addConstraint("blocks", "blocks_pkey", {
    primaryKey: ["chain_id", "block_number"],
  });

  pgm.createIndex("blocks", "status");
};

exports.down = (pgm) => {
  pgm.dropTable("blocks");
};
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("tokens", {
    contract_address: { type: "CHAR(42)", notNull: true },
    chain_id: { type: "INT", notNull: true },
    name: { type: "VARCHAR(255)" },
    symbol: { type: "VARCHAR(50)" },
    decimals: { type: "INT" },
    spam_score: { type: "INT", notNull: true, default: 0 },
    status: { type: "VARCHAR(20)", notNull: true, default: "pending" },
    discovered_at_block: { type: "BIGINT", notNull: true },
    created_at: { type: "TIMESTAMPTZ", notNull: true, default: pgm.func("NOW()") },
    updated_at: { type: "TIMESTAMPTZ", notNull: true, default: pgm.func("NOW()") },
  });

  pgm.addConstraint("tokens", "tokens_pkey", {
    primaryKey: ["chain_id", "contract_address"],
  });

  pgm.createIndex("tokens", "status");
  pgm.createIndex("tokens", "discovered_at_block");
};

exports.down = (pgm) => {
  pgm.dropTable("tokens");
};
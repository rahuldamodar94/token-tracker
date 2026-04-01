import { Pool } from "pg";
import config from "./config";

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  max: 20,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export async function testConnection() {
  try {
    await pool.query("SELECT NOW()");
    console.log("Database connection successful");
  } catch (err) {
    console.error("Database connection error", err);
  }
}

export default pool;
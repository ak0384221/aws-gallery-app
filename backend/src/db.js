import pg from "pg";
import config from "./config.js";

const { Pool } = pg;

export const pool = new Pool({
  host: config.dbHost,
  port: config.dbPort,
  database: config.dbName,
  user: config.dbUser,
  password: config.dbPassword,
});

export async function initializeDatabase() {
  const attempts = 5;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await pool.query("SELECT 1");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          caption TEXT,
          image_key TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      return;
    } catch (error) {
      if (attempt === attempts) throw error;
      console.log(
        `Database unavailable; retrying (${attempt}/${attempts - 1})`,
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

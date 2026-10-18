import app from "./app.js";
import config from "./config.js";
import { pool, initializeDatabase } from "./db.js";

let server;

try {
  await initializeDatabase();
  server = app.listen(config.port, "0.0.0.0", () => {
    console.log(`Server listening on port ${config.port}`);
  });
} catch (error) {
  console.log(`Could not connect to the database: ${error.message}`);
  await pool.end();
  process.exitCode = 1;
}

process.on("SIGTERM", () => {
  if (!server) {
    pool.end().finally(() => process.exit(0));
    return;
  }

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
});

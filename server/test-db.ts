// server/test-db.ts
import "dotenv/config";
import { pool } from "./db";

async function main() {
  try {
    const result = await pool.query("SELECT 1 as x");
    console.log("✅ DB OK:", result.rows);
  } catch (err) {
    console.error("❌ DB ERROR:", err);
  } finally {
    await pool.end();
  }
}

main();

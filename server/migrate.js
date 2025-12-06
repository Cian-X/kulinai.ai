// server/migrate.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, "migrate.sql"), "utf8");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log("Running migrations...");
    await pool.query(sql);
    console.log("Migrations finished.");
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    await pool.end();
    process.exit(1);
  }
})();

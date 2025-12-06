import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await client.connect();
    console.log("⏳ Running migrations...");

    // Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Menus
    await client.query(`
      CREATE TABLE IF NOT EXISTS menus (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        price INT NOT NULL,
        category TEXT,
        image TEXT,
        available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Carts (simple)
    await client.query(`
      CREATE TABLE IF NOT EXISTS carts (
        user_id UUID NOT NULL,
        menu_id UUID NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        PRIMARY KEY (user_id, menu_id)
      );
    `);

    // Orders (items stored as JSONB)
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        items JSONB NOT NULL,
        total INT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Reviews
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY,
        order_id UUID,
        user_id UUID,
        user_name TEXT,
        menu_name TEXT,
        rating INT,
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Favorites
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        user_id UUID NOT NULL,
        menu_id UUID NOT NULL,
        PRIMARY KEY (user_id, menu_id)
      );
    `);

    console.log("✅ Migration selesai, semua tabel berhasil dibuat!");
  } catch (err) {
    console.error("❌ Migration error:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

migrate();

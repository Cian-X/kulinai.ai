import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  await client.connect();

  // USERS TABLE
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `);

  // MENUS TABLE
  await client.query(`
    CREATE TABLE IF NOT EXISTS menus (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price INT NOT NULL,
      category TEXT,
      image TEXT,
      available BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // ORDERS TABLE
  await client.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL,
      items JSONB NOT NULL,
      total INT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // REVIEWS TABLE
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

  // FAVORITES TABLE
  await client.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      user_id UUID NOT NULL,
      menu_id UUID NOT NULL
    );
  `);

  console.log("✅ Migration selesai, semua tabel berhasil dibuat!");
  await client.end();
}

migrate();

-- server/migrate.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- menus
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  category TEXT,
  image TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- carts (one row per user, items as jsonb array)
CREATE TABLE IF NOT EXISTS carts (
  user_id UUID PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP DEFAULT now()
);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  items JSONB NOT NULL,
  total INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

-- reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID,
  user_id UUID,
  user_name TEXT,
  menu_name TEXT,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- favorites (user - menu)
CREATE TABLE IF NOT EXISTS favorites (
  user_id UUID NOT NULL,
  menu_id UUID NOT NULL,
  PRIMARY KEY (user_id, menu_id)
);

import pg from "pg";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const menus = [
  // Makanan Utama
  { name: "Ayam Geprek Level 5", description: "Ayam goreng crispy dengan sambal pedas level 5, nasi putih, dan lalapan", price: 25000, category: "Makanan Utama", image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop&q=80" },
  { name: "Nasi Goreng Spesial", description: "Nasi goreng dengan ayam, udang, telur, dan kerupuk", price: 20000, category: "Makanan Utama", image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=400&fit=crop&q=80" },
  { name: "Sate Ayam Madura", description: "Sate ayam bumbu kacang dengan lontong dan sambal", price: 30000, category: "Makanan Utama", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop&q=80" },
  { name: "Bakso Urat", description: "Bakso urat dengan mie dan bihun", price: 18000, category: "Makanan Utama", image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop&q=80" },
  { name: "Mie Ayam", description: "Mie ayam dengan pangsit dan bakso", price: 15000, category: "Makanan Utama", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop&q=80" },
  { name: "Gado-Gado", description: "Sayuran rebus dengan bumbu kacang", price: 12000, category: "Makanan Utama", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop&q=80" },
  { name: "Pecel Lele", description: "Lele goreng dengan sambal dan lalapan", price: 22000, category: "Makanan Utama", image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop&q=80" },
  { name: "Rawon", description: "Rawon daging dengan nasi dan kerupuk", price: 28000, category: "Makanan Utama", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop&q=80" },
  { name: "Soto Ayam", description: "Soto ayam dengan nasi dan kerupuk", price: 20000, category: "Makanan Utama", image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop&q=80" },
  { name: "Rendang", description: "Rendang daging sapi dengan nasi putih", price: 35000, category: "Makanan Utama", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop&q=80" },
  { name: "Gudeg", description: "Gudeg nangka muda dengan ayam dan telur", price: 25000, category: "Makanan Utama", image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=400&fit=crop&q=80" },
  { name: "Pempek", description: "Pempek kapal selam dengan cuko", price: 20000, category: "Makanan Utama", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop&q=80" },
  { name: "Nasi Padang", description: "Nasi padang dengan berbagai lauk pilihan", price: 30000, category: "Makanan Utama", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop&q=80" },
  { name: "Ketoprak", description: "Ketoprak dengan tahu, lontong, dan bumbu kacang", price: 15000, category: "Makanan Utama", image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=400&fit=crop&q=80" },
  { name: "Lontong Sayur", description: "Lontong sayur dengan labu siam dan telur", price: 18000, category: "Makanan Utama", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop&q=80" },

  // Minuman
  { name: "Es Kopi Susu", description: "Kopi hitam dengan susu dan es batu", price: 10000, category: "Minuman", image: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=400&fit=crop&q=80" },
  { name: "Es Teh Manis", description: "Teh manis dingin dengan es batu", price: 5000, category: "Minuman", image: "https://images.unsplash.com/photo-1556679343-c7306c197ee3?w=400&h=400&fit=crop&q=80" },
  { name: "Es Jeruk", description: "Jus jeruk segar dengan es batu", price: 8000, category: "Minuman", image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop&q=80" },
  { name: "Es Campur", description: "Es campur dengan berbagai buah dan jelly", price: 12000, category: "Minuman", image: "https://images.unsplash.com/photo-1556679343-c7306c197ee3?w=400&h=400&fit=crop&q=80" },
  { name: "Jus Alpukat", description: "Jus alpukat dengan susu dan es", price: 15000, category: "Minuman", image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop&q=80" },
  { name: "Es Cendol", description: "Cendol dengan santan dan gula merah", price: 10000, category: "Minuman", image: "https://images.unsplash.com/photo-1556679343-c7306c197ee3?w=400&h=400&fit=crop&q=80" },
  { name: "Es Dawet", description: "Dawet hijau dengan santan", price: 8000, category: "Minuman", image: "https://images.unsplash.com/photo-1556679343-c7306c197ee3?w=400&h=400&fit=crop&q=80" },
  { name: "Jus Mangga", description: "Jus mangga segar dengan es", price: 12000, category: "Minuman", image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop&q=80" },
  { name: "Es Kelapa Muda", description: "Kelapa muda segar dengan es", price: 15000, category: "Minuman", image: "https://images.unsplash.com/photo-1556679343-c7306c197ee3?w=400&h=400&fit=crop&q=80" },
  { name: "Es Teler", description: "Es teler dengan alpukat, nangka, dan kelapa", price: 18000, category: "Minuman", image: "https://images.unsplash.com/photo-1556679343-c7306c197ee3?w=400&h=400&fit=crop&q=80" },

  // Snack
  { name: "Kerupuk", description: "Kerupuk renyah berbagai rasa", price: 3000, category: "Snack", image: "https://images.unsplash.com/photo-1562962234-7c607178b5e4?w=400&h=400&fit=crop&q=80" },
  { name: "Pisang Goreng", description: "Pisang goreng crispy dengan gula", price: 8000, category: "Snack", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop&q=80" },
  { name: "Tahu Goreng", description: "Tahu goreng dengan bumbu kacang", price: 10000, category: "Snack", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop&q=80" },
  { name: "Tempe Goreng", description: "Tempe goreng crispy", price: 8000, category: "Snack", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop&q=80" }
];

async function seed() {
  try {
    console.log("⏳ Menghubungkan ke database...");
    await client.connect();
	
	await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS menus_name_unique ON menus (name)`);

    for (const m of menus) {
      await client.query(
        `INSERT INTO menus (id, name, description, price, category, image, available, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
         ON CONFLICT (name) DO NOTHING`,
        [randomUUID(), m.name, m.description, m.price, m.category, m.image]
      );
    }

    console.log("✅ SEED selesai! Semua menu berhasil dimasukkan.");
  } catch (err) {
    console.error("❌ ERROR saat seed:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seed();

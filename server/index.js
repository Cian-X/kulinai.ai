require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Pool untuk Railway Postgres. Keep rejectUnauthorized=false untuk koneksi internal.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// simple healthcheck
app.get('/api/ping', (req, res) => {
  res.json({ ok: true });
});

/**
 * GET /api/menus
 * Ambil semua rows dari tabel `menus`.
 * Sesuaikan nama tabel/kolom kalau di DB beda.
 */
app.get('/api/menus', async (req, res) => {
  try {
    const q = `SELECT id, name, description, price, category, image, available, created_at
               FROM menus
               ORDER BY created_at DESC NULLS LAST;`;
    const { rows } = await pool.query(q);
    // jika kolom/database berbeda (contoh createdAt vs created_at), kita tetap kembalikan data raw dari DB
    res.json(rows);
  } catch (err) {
    console.error('Error GET /api/menus', err);
    res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * Optional: GET /api/menus/:id
 */
app.get('/api/menus/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const q = 'SELECT * FROM menus WHERE id = $1 LIMIT 1';
    const { rows } = await pool.query(q, [id]);
    if (!rows.length) return res.status(404).json({ error: 'not_found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error GET /api/menus/:id', err);
    res.status(500).json({ error: 'internal_server_error' });
  }
});

// fallback untuk pengembangan — jangan tampilkan HTML di production
app.use((req, res) => {
  res.status(404).send('Cannot ' + req.method + ' ' + req.path);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on ${port}`));

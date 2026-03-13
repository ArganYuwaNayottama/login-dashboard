import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test DB connection
pool.connect()
  .then(() => console.log("✅ Database connected"))
  .catch((err) => console.error("❌ DB connection failed:", err.message));

// =================== CRUD Produk ===================

// GET semua produk
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, p.size, p.price, p.stock, p.description, p.category_id, c.category AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memuat produk" });
  }
});

// GET semua kategori
app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memuat kategori" });
  }
});

// POST tambah produk
app.post("/api/products", async (req, res) => {
  try {
    const { name, size, price, stock, description, category } = req.body;
    const result = await pool.query(
      `INSERT INTO products (name, size, price, stock, description, category_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, size, price, stock, description, category]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambah produk" });
  }
});

// PUT update produk
app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, size, price, stock, description, category } = req.body;
    const result = await pool.query(
      `UPDATE products SET name=$1, size=$2, price=$3, stock=$4, description=$5, category_id=$6
       WHERE id=$7 RETURNING *`,
      [name, size, price, stock, description, category, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal update produk" });
  }
});

// DELETE produk
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM products WHERE id=$1", [id]);
    res.json({ message: "Produk berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal hapus produk" });
  }
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Login Gagal" });
        }

        const user = result.rows[0];

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: "Login Gagal" });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login Berhasil",
            token: token,
        });

    } catch (error) {
        console.error("ERROR LOGIN:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Endpoint GET - Mengambil semua produk dari database dengan kategori
app.get("/api/products", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                p.id_product as id,
                p.name_product as title,
                p.price,
                p.stock,
                c.id_category,
                c.name_category as category,
                c.description
            FROM products p
            LEFT JOIN categories c ON p.id_category = c.id_category
            ORDER BY p.id_product ASC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error("ERROR GET PRODUCTS:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

app.listen(3000, () => {
    console.log("Server berjalan di http://localhost:3000/api");
});
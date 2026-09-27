require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const bcrypt = require("bcryptjs"); 
const pool = require("./db"); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// RUTA DE PRUEBA
app.get('/', (req, res) => {
    res.json({ mensaje: "¡API de usuarios funcionando correctamente!" });
});

// ==========================================
// 1. RUTA POST: REGISTRAR USUARIOS
// ==========================================
app.post('/api/usuarios', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
        const [resultado] = await pool.query(query, [nombre, email, hashedPassword]);

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            id: resultado.insertId
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ==========================================
// 2. RUTA GET: CONSULTAR TODOS LOS USUARIOS
// ==========================================
app.get('/api/usuarios', async (req, res) => {
    try {
        const query = 'SELECT id, nombre, email FROM usuarios';
        const [usuarios] = await pool.query(query);
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Levantar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
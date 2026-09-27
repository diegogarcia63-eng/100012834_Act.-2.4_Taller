// src/server.js

// 1. Importar librerías base
require("dotenv").config({ path: __dirname + '/../.env' });
const express = require("express");
const cors = require("cors");

// 2. Importar nuestras capas (Hexagonal)
const UserRepositoryAdapter = require('./infrastructure/userRepositoryAdapter');
const UserService = require('./application/userService');
const UserController = require('./interfaces/userController');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS y formato JSON
app.use(cors());
app.use(express.json());

// ==========================================
// 3. ENSAMBLAJE (Inyección de Dependencias)
// ==========================================
const userRepository = new UserRepositoryAdapter();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// ==========================================
// 4. DEFINICIÓN DE RUTAS
// ==========================================
app.post('/api/usuarios', (req, res) => userController.createUser(req, res));
app.get('/api/usuarios', (req, res) => userController.getUsers(req, res));
app.put('/api/usuarios/:id', (req, res) => userController.updateUser(req, res));
app.delete('/api/usuarios/:id', (req, res) => userController.deleteUser(req, res));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: "¡API Hexagonal funcionando correctamente!" });
});

// 5. Levantar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
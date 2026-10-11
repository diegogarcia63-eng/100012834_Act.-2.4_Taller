// src/server.js

// 1. Importar librerías base
require("dotenv").config({ path: __dirname + '/../.env' });
const express = require("express");
const cors = require("cors");

// 2. Importar nuestras capas (Hexagonal) - Usuarios
const UserRepositoryAdapter = require('./infrastructure/userRepositoryAdapter');
const UserService = require('./application/userService');
const UserController = require('./interfaces/userController');

// 2.1 Importar nuestras capas (Hexagonal) - Órdenes y Correos (TAREA 3)
const NodemailerAdapter = require('./infrastructure/adapters/out/email/NodemailerAdapter');
const CreateOrderUseCase = require('./application/useCases/CreateOrderUseCase');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS y formato JSON
app.use(cors());
app.use(express.json());

// ==========================================
// 3. ENSAMBLAJE (Inyección de Dependencias)
// ==========================================

// -> Ensamblaje de Usuarios
const userRepository = new UserRepositoryAdapter();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// -> Ensamblaje de Órdenes y Correos
const mockOrderRepository = {
    create: async (orderData) => {
        // Simulamos que la BD le asigna un ID a la orden
        return { id: Math.floor(Math.random() * 10000), ...orderData };
    }
};
const emailAdapter = new NodemailerAdapter();
const createOrderUseCase = new CreateOrderUseCase(mockOrderRepository, emailAdapter);


// ==========================================
// 4. DEFINICIÓN DE RUTAS
// ==========================================

// -> Rutas de Usuarios
app.post('/api/usuarios', (req, res) => userController.createUser(req, res));
app.get('/api/usuarios', (req, res) => userController.getUsers(req, res));
app.put('/api/usuarios/:id', (req, res) => userController.updateUser(req, res));
app.delete('/api/usuarios/:id', (req, res) => userController.deleteUser(req, res));

// -> Rutas de Órdenes (AQUÍ ESTÁ LA SOLUCIÓN AL 404)
app.post('/api/ordenes', async (req, res) => {
    try {
        const ordenGuardada = await createOrderUseCase.execute(req.body);
        res.status(200).json({ mensaje: 'Orden procesada y correo enviado', orden: ordenGuardada });
    } catch (error) {
        console.error("Error al procesar orden:", error);
        res.status(500).json({ error: 'Fallo al procesar la orden' });
    }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: "¡API Hexagonal funcionando correctamente!" });
});

// ==========================================
// 5. LEVANTAR EL SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
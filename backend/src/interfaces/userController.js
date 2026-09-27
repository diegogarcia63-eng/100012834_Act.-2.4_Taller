// src/interfaces/userController.js

class UserController {
    constructor(userService) {
        this.userService = userService;
    }

    // 1. POST
    async createUser(req, res) {
        try {
            const { nombre, email, password } = req.body;
            const id = await this.userService.registerUser(nombre, email, password);
            res.status(201).json({ mensaje: 'Usuario registrado exitosamente', id: id });
        } catch (error) {
            if (error.message === 'Todos los campos son obligatorios') return res.status(400).json({ error: error.message });
            if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'El email ya está registrado' });
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // 2. GET
    async getUsers(req, res) {
        try {
            const usuarios = await this.userService.getAllUsers();
            res.status(200).json(usuarios);
        } catch (error) {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // 3. PUT - ¡NUEVO!
    async updateUser(req, res) {
        try {
            const id = req.params.id; // Sacamos el ID de la URL
            const { nombre, email, password } = req.body;
            
            await this.userService.updateUser(id, nombre, email, password);
            res.status(200).json({ mensaje: `Usuario con ID ${id} actualizado correctamente` });
        } catch (error) {
            if (error.message === 'Usuario no encontrado') return res.status(404).json({ error: error.message });
            if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'El email ya está registrado' });
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // 4. DELETE - ¡NUEVO!
    async deleteUser(req, res) {
        try {
            const id = req.params.id; // Sacamos el ID de la URL
            await this.userService.deleteUser(id);
            res.status(200).json({ mensaje: `Usuario con ID ${id} eliminado correctamente` });
        } catch (error) {
            if (error.message === 'Usuario no encontrado') return res.status(404).json({ error: error.message });
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
}

module.exports = UserController;
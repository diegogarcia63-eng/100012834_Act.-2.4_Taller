// src/application/userService.js
const bcrypt = require("bcryptjs"); 
const User = require("../domain/user"); 

class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    // 1. Registrar (POST)
    async registerUser(nombre, email, password) {
        if (!nombre || !email || !password) {
            throw new Error('Todos los campos son obligatorios');
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new User(null, nombre, email, hashedPassword);
        return await this.userRepository.save(newUser);
    }

    // 2. Obtener todos (GET)
    async getAllUsers() {
        return await this.userRepository.findAll();
    }

    // 3. Actualizar (PUT) - ¡NUEVO!
    async updateUser(id, nombre, email, password) {
        if (!nombre || !email || !password) {
            throw new Error('Todos los campos son obligatorios');
        }
        
        // Encriptamos la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const userToUpdate = new User(id, nombre, email, hashedPassword);
        const actualizado = await this.userRepository.update(id, userToUpdate);
        
        if (!actualizado) {
            throw new Error('Usuario no encontrado');
        }
        return true;
    }

    // 4. Eliminar (DELETE) - ¡NUEVO!
    async deleteUser(id) {
        const eliminado = await this.userRepository.deleteById(id);
        
        if (!eliminado) {
            throw new Error('Usuario no encontrado');
        }
        return true;
    }
}

module.exports = UserService;
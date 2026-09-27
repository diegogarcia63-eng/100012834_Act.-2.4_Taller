// src/domain/userRepositoryPort.js

class UserRepositoryPort {
    // Método para guardar un usuario
    async save(user) { 
        throw new Error("El método save() debe ser implementado por un adaptador"); 
    }

    // Método para obtener todos los usuarios
    async findAll() { 
        throw new Error("El método findAll() debe ser implementado por un adaptador"); 
    }
    
    // Método para actualizar un usuario
    async update(id, user) { 
        throw new Error("El método update() debe ser implementado por un adaptador"); 
    }
    
    // Método para eliminar un usuario
    async deleteById(id) { 
        throw new Error("El método deleteById() debe ser implementado por un adaptador"); 
    }
}

module.exports = UserRepositoryPort;
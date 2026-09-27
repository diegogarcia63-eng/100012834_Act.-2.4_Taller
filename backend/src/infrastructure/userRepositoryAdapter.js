// src/infrastructure/userRepositoryAdapter.js
const pool = require('./db');
const UserRepositoryPort = require('../domain/userRepositoryPort');

class UserRepositoryAdapter extends UserRepositoryPort {
    
    // 1. Guardar (POST)
    async save(user) {
        const query = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
        const [resultado] = await pool.query(query, [user.nombre, user.email, user.password]);
        return resultado.insertId;
    }

    // 2. Obtener todos (GET)
    async findAll() {
        const query = 'SELECT id, nombre, email FROM usuarios';
        const [usuarios] = await pool.query(query);
        return usuarios;
    }

    // 3. Actualizar (PUT) - ¡NUEVO!
    async update(id, user) {
        const query = 'UPDATE usuarios SET nombre = ?, email = ?, password = ? WHERE id = ?';
        const [resultado] = await pool.query(query, [user.nombre, user.email, user.password, id]);
        return resultado.affectedRows > 0; // Devuelve true si encontró el ID y lo actualizó
    }

    // 4. Eliminar (DELETE) - ¡NUEVO!
    async deleteById(id) {
        const query = 'DELETE FROM usuarios WHERE id = ?';
        const [resultado] = await pool.query(query, [id]);
        return resultado.affectedRows > 0; // Devuelve true si encontró el ID y lo borró
    }
}

module.exports = UserRepositoryAdapter;
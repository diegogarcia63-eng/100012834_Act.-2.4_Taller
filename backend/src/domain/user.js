// src/domain/user.js

class User {
    constructor(id, nombre, email, password) {
        this.id = id;
        this.nombre = nombre;
        this.email = email;
        this.password = password; // Nota: Aquí llegará la contraseña ya encriptada
    }
}

module.exports = User;
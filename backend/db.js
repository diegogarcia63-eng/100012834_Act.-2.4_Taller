const mysql = require('mysql2/promise');
require('dotenv').config();

// Crear el "pool" de conexiones
// Un pool administra múltiples conexiones para que la API sea más rápida y eficiente
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Probar la conexión al iniciar
pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión a la base de datos MySQL establecida con éxito.');
        connection.release(); // Es importante liberar la conexión después de usarla
    })
    .catch(err => {
        console.error('❌ Error fatal al conectar con la base de datos:', err.message);
    });

// Exportamos el pool para poder usarlo en index.js y en nuestras rutas
module.exports = pool;
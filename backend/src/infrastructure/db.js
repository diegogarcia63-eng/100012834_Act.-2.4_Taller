// src/infrastructure/db.js
const mysql = require('mysql2/promise');

// Subimos dos niveles (../../) para encontrar el archivo .env en la raíz del proyecto
require('dotenv').config({ path: __dirname + '/../../.env' }); 

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión a MySQL establecida (Arquitectura Hexagonal).');
        connection.release();
    })
    .catch(err => console.error('❌ Error fatal al conectar con la base de datos:', err.message));

module.exports = pool;
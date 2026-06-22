
require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

module.exports = pool;


require("dotenv").config(); //  carga variables de .env
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',              // tu usuario de MySQL
    password: 'estudiante',   // tu contraseña real de MySQL
    database: 'sistema_facturas'
});

module.exports = pool;


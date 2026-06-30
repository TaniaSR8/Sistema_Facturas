const pool = require("../config/db");

// Buscar usuario por correo
const getUsuarioByCorreo = async (correo) => {
    try {
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE correo = ?", [correo]);
        return rows[0];
    } catch (err) {
        throw err;
    }
};

// Crear usuario nuevo
const crearUsuario = async (usuario) => {
    try {
        const [results] = await pool.query("INSERT INTO usuarios SET ?", usuario);
        return results.insertId; //  devuelve el ID del nuevo usuario
    } catch (err) {
        console.error("Error en INSERT:", err);
        throw err;
    }
};

module.exports = { getUsuarioByCorreo, crearUsuario };

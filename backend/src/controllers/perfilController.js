const db = require("../config/db");
const bcrypt = require("bcrypt");

exports.obtenerPerfil = async (req, res) => {
    try {
        const { correo } = req.query;
        const [rows] = await db.query("SELECT * FROM usuarios WHERE correo = ?", [correo]);
        if (rows.length === 0) return res.status(404).json({ mensaje: "Usuario no encontrado" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener perfil" });
    }
};

exports.actualizarPerfil = async (req, res) => {
    try {
        const { nombre, correo, estado, telefono, numeroEmpleado } = req.body;
        await db.query(
            "UPDATE usuarios SET nombre=?, correo=?, estado=?, telefono=? WHERE numeroEmpleado=?",
            [nombre, correo, estado, telefono, numeroEmpleado]
        );
        res.json({ nombre, correo, estado, telefono, numeroEmpleado });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar perfil" });
    }
};

exports.cambiarContrasena = async (req, res) => {
    try {
        const { contrasenaActual, nuevaContrasena, correo } = req.body;
        const [rows] = await db.query("SELECT password FROM usuarios WHERE correo=?", [correo]);
        if (rows.length === 0) return res.status(404).json({ mensaje: "Usuario no encontrado" });

        const coincide = await bcrypt.compare(contrasenaActual, rows[0].password);
        if (!coincide) return res.status(400).json({ mensaje: "Contraseña actual incorrecta" });

        const hash = await bcrypt.hash(nuevaContrasena, 10);
        await db.query("UPDATE usuarios SET password=? WHERE correo=?", [hash, correo]);

        res.json({ mensaje: "Contraseña actualizada" });
    } catch (error) {
        res.status(500).json({ error: "Error al cambiar contraseña" });
    }
};

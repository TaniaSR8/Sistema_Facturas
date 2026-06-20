const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

// Ruta para registrar usuarios
router.post('/api/usuarios', async (req, res) => {
    const { numeroEmpleado, nombre, apellidoPaterno, apellidoMaterno, rfc, correo, rol, estado, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO usuarios (numeroEmpleado, nombre, apellidoPaterno, apellidoMaterno, rfc, correo, rol, estado, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [numeroEmpleado, nombre, apellidoPaterno, apellidoMaterno, rfc, correo, rol, estado || 'ACTIVO', hashedPassword]
        );

        res.status(201).json({ message: 'Usuario registrado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

module.exports = router;

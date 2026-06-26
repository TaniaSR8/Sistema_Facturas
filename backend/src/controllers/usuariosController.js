const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getUsuarioByCorreo, crearUsuario } = require("../models/usuariosModel");

// Registro de usuario
const register = async (req, res) => {
    const {
        numeroEmpleado,
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        correo,
        contrasena,
        rol,
        rfc,
        telefono,
        estado
    } = req.body;

    // Validación: todos los campos obligatorios
    if (
        !numeroEmpleado ||
        !nombre ||
        !apellidoPaterno ||
        !apellidoMaterno ||
        !correo ||
        !contrasena ||
        !rol ||
        !rfc ||
        !telefono ||
        !estado
    ) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    //  Aquí va la validación de formato de correo
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoRegex.test(correo)) {
        return res.status(400).json({ error: "Formato de correo inválido" });
    }


    try {

        //  Validación de rol SUPERADMIN
        if (rol === "SUPERADMIN") {
            const [rows] = await pool.query("SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'SUPERADMIN'");
            if (rows[0].total > 0) {
                return res.status(403).json({ error: "No está permitido registrar un SUPERADMIN adicional" });
            }
        }
        const hashedPassword = await bcrypt.hash(contrasena, 10);

        const nuevoUsuario = {
            numeroEmpleado,
            nombre,
            apellidoPaterno,
            apellidoMaterno,
            correo,
            password: hashedPassword,
            rol,
            rfc,
            telefono,
            estado
        };

        const id = await crearUsuario(nuevoUsuario);

        //  Devolvemos todos los datos, pero ocultamos el password
        const usuarioRespuesta = { id, ...nuevoUsuario };
        delete usuarioRespuesta.password;

        return res.status(201).json({
            message: "Usuario registrado ✅",
            usuario: usuarioRespuesta
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "El número de empleado, correo o RFC ya existe" });
        }
        console.error("Error en register:", error);
        return res.status(500).json({ message: "Error al registrar usuario" });
    }
};

// Login con JWT
const login = async (req, res) => {
    const { correo, contrasena } = req.body;

    // Validación: ambos campos obligatorios
    if (!correo || !contrasena) {
        return res.status(400).json({ error: "Correo y contraseña son obligatorios" });
    }

    try {
        const usuario = await getUsuarioByCorreo(correo);
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        const match = await bcrypt.compare(contrasena, usuario.password);
        if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol, correo: usuario.correo },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        return res.json({ message: "Login exitoso ✅", token });
    } catch (error) {
        console.error("Error en login:", error);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};

const pool = require("../config/db");

// Listar todos los usuarios
const getUsuarios = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, numeroEmpleado, nombre, apellidoPaterno, apellidoMaterno, correo, rol, rfc, telefono, estado FROM usuarios"
        );
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ message: "Error al obtener usuarios" });
    }
};


// Actualizar estado de usuario (Completo o parcial)
const updateUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Obtener el usuario actual para hacer merge con los campos que falten
        const [rows] = await pool.query(
            "SELECT numeroEmpleado, nombre, apellidoPaterno, apellidoMaterno, correo, rol, rfc, telefono, estado FROM usuarios WHERE id=?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const usuarioExistente = rows[0];

        // 2. Fusionar con los datos recibidos (si algún campo viene indefinido, conservar el actual de la BD)
        const numeroEmpleadoFinal = req.body.numeroEmpleado !== undefined ? req.body.numeroEmpleado : usuarioExistente.numeroEmpleado;
        const nombreFinal = req.body.nombre !== undefined ? req.body.nombre : usuarioExistente.nombre;
        const apellidoPaternoFinal = req.body.apellidoPaterno !== undefined ? req.body.apellidoPaterno : usuarioExistente.apellidoPaterno;
        const apellidoMaternoFinal = req.body.apellidoMaterno !== undefined ? req.body.apellidoMaterno : usuarioExistente.apellidoMaterno;
        const correoFinal = req.body.correo !== undefined ? req.body.correo : usuarioExistente.correo;
        const rolFinal = req.body.rol !== undefined ? req.body.rol : usuarioExistente.rol;
        const rfcFinal = req.body.rfc !== undefined ? req.body.rfc : usuarioExistente.rfc;
        const telefonoFinal = req.body.telefono !== undefined ? req.body.telefono : usuarioExistente.telefono;
        const estadoFinal = req.body.estado !== undefined ? req.body.estado : usuarioExistente.estado;

        // 3. Ejecutar la actualización en la base de datos
        const [result] = await pool.query(
            `UPDATE usuarios 
       SET numeroEmpleado=?, nombre=?, apellidoPaterno=?, apellidoMaterno=?, correo=?, rol=?, rfc=?, telefono=?, estado=? 
       WHERE id=?`,
            [
                numeroEmpleadoFinal,
                nombreFinal,
                apellidoPaternoFinal,
                apellidoMaternoFinal,
                correoFinal,
                rolFinal,
                rfcFinal,
                telefonoFinal,
                estadoFinal,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // 4. Obtener y retornar el usuario actualizado completo
        const [updatedRows] = await pool.query(
            "SELECT id, numeroEmpleado, nombre, apellidoPaterno, apellidoMaterno, correo, rol, rfc, telefono, estado FROM usuarios WHERE id=?",
            [id]
        );

        res.json(updatedRows[0]);
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        res.status(500).json({ message: "Error al actualizar usuario" });
    }
};




module.exports = { register, login, getUsuarios, updateUsuario };

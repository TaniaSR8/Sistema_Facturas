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
        password,
        rol,
        rfc
    } = req.body;

    // Validación: todos los campos obligatorios
    if (
        !numeroEmpleado ||
        !nombre ||
        !apellidoPaterno ||
        !apellidoMaterno ||
        !correo ||
        !password ||
        !rol ||
        !rfc
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
        const hashedPassword = await bcrypt.hash(password, 10);

        const nuevoUsuario = {
            numeroEmpleado,
            nombre,
            apellidoPaterno,
            apellidoMaterno,
            correo,
            password: hashedPassword,
            rol,
            rfc
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
    const { correo, password } = req.body;

    // Validación: ambos campos obligatorios
    if (!correo || !password) {
        return res.status(400).json({ error: "Correo y contraseña son obligatorios" });
    }

    try {
        const usuario = await getUsuarioByCorreo(correo);
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        const match = await bcrypt.compare(password, usuario.password);
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
            "SELECT id, numeroEmpleado, nombre, apellidoPaterno, apellidoMaterno, correo, rol, rfc, estado FROM usuarios"
        );
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ message: "Error al obtener usuarios" });
    }
};

module.exports = { register, login, getUsuarios };

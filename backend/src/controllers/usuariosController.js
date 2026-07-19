const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { getUsuarioByCorreo, crearUsuario } = require("../models/usuariosModel");
const { enviarCorreoRecuperacion } = require("../config/mailer");


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

        // 👇 quitamos el password antes de enviar
        const { password, ...usuarioSinPassword } = usuario;

        return res.json({
            message: "Login exitoso ✅",
            token,
            usuario: usuarioSinPassword
        });
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



// ---------------------------------------------------------------------------
// Recuperación de contraseña
// ---------------------------------------------------------------------------
const TOKEN_VIGENCIA_MINUTOS = 60;

// POST /usuarios/solicitar-recuperacion
const solicitarRecuperacion = async (req, res) => {
    const { correo } = req.body;

    if (!correo || correo.trim() === "") {
        return res.status(400).json({ error: "El correo es obligatorio" });
    }

    // Respuesta genérica siempre, para no revelar si el correo existe o no
    const respuestaGenerica = {
        mensaje: "Si el correo está registrado, recibirás un enlace de recuperación.",
    };

    try {
        const usuario = await getUsuarioByCorreo(correo.trim());

        if (!usuario || usuario.estado !== "ACTIVO") {
            return res.json(respuestaGenerica);
        }

        const token = crypto.randomBytes(32).toString("hex");
        const expiracion = new Date(Date.now() + TOKEN_VIGENCIA_MINUTOS * 60 * 1000);

        await pool.query(
            `INSERT INTO tokens_sesion (usuario_id, token, tipo, fechaCreacion, expiracion)
             VALUES (?, ?, 'RESET', NOW(), ?)
             ON DUPLICATE KEY UPDATE token = VALUES(token), fechaCreacion = NOW(), expiracion = VALUES(expiracion)`,
            [usuario.id, token, expiracion]
        );

        const enlace = `${process.env.FRONTEND_URL}/restablecer-contrasena?token=${token}`;
        await enviarCorreoRecuperacion(usuario.correo, usuario.nombre, enlace);

        return res.json(respuestaGenerica);
    } catch (error) {
        console.error("Error en solicitarRecuperacion:", error);
        return res.status(500).json({ error: "Error al procesar la solicitud" });
    }
};

// GET /usuarios/validar-token-recuperacion?token=xxx
const validarTokenRecuperacion = async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ valido: false, error: "Token no proporcionado" });

    try {
        const [rows] = await pool.query(
            "SELECT usuario_id, expiracion FROM tokens_sesion WHERE token = ? AND tipo = 'RESET'",
            [token]
        );

        if (rows.length === 0) {
            return res.json({ valido: false, error: "El enlace no es válido" });
        }

        if (new Date(rows[0].expiracion) < new Date()) {
            return res.json({ valido: false, error: "El enlace ha expirado, solicita uno nuevo" });
        }

        return res.json({ valido: true });
    } catch (error) {
        console.error("Error en validarTokenRecuperacion:", error);
        return res.status(500).json({ valido: false, error: "Error al validar el enlace" });
    }
};

// POST /usuarios/restablecer-contrasena
const restablecerContrasena = async (req, res) => {
    const { token, nuevaContrasena } = req.body;

    if (!token || !nuevaContrasena) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    try {
        const [rows] = await pool.query(
            "SELECT usuario_id, expiracion FROM tokens_sesion WHERE token = ? AND tipo = 'RESET'",
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: "El enlace no es válido" });
        }

        if (new Date(rows[0].expiracion) < new Date()) {
            return res.status(400).json({ error: "El enlace ha expirado, solicita uno nuevo" });
        }

        // Validamos la nueva contraseña contra las políticas activas del Superadmin
        const [politicasRows] = await pool.query("SELECT * FROM config_seguridad ORDER BY id DESC LIMIT 1");
        if (politicasRows.length > 0) {
            const p = politicasRows[0];
            const errores = [];
            if (nuevaContrasena.length < p.longitudMinima) errores.push(`mínimo ${p.longitudMinima} caracteres`);
            if (nuevaContrasena.length > p.longitudMaxima) errores.push(`máximo ${p.longitudMaxima} caracteres`);
            if ((nuevaContrasena.match(/[0-9]/g) || []).length < p.minNumeros) errores.push(`mínimo ${p.minNumeros} número(s)`);
            if ((nuevaContrasena.match(/[A-Z]/g) || []).length < p.minMayusculas) errores.push(`mínimo ${p.minMayusculas} mayúscula(s)`);
            if ((nuevaContrasena.match(/[a-z]/g) || []).length < p.minMinusculas) errores.push(`mínimo ${p.minMinusculas} minúscula(s)`);
            if ((nuevaContrasena.match(/[^A-Za-z0-9]/g) || []).length < p.minEspeciales) errores.push(`mínimo ${p.minEspeciales} carácter(es) especial(es)`);

            if (errores.length > 0) {
                return res.status(400).json({ error: "La contraseña no cumple los requisitos: " + errores.join(", ") });
            }
        }

        const hash = await bcrypt.hash(nuevaContrasena, 10);
        await pool.query("UPDATE usuarios SET password = ? WHERE id = ?", [hash, rows[0].usuario_id]);

        // El token se usa una sola vez
        await pool.query("DELETE FROM tokens_sesion WHERE token = ? AND tipo = 'RESET'", [token]);

        return res.json({ mensaje: "Contraseña actualizada correctamente" });
    } catch (error) {
        console.error("Error en restablecerContrasena:", error);
        return res.status(500).json({ error: "Error al restablecer la contraseña" });
    }
};



module.exports = { register, login, getUsuarios, updateUsuario,
    solicitarRecuperacion,
    validarTokenRecuperacion,
    restablecerContrasena
};
